"use client";
// The big room on the pipeline board (Faizuddin, 2026-10-27): one shared pixel
// room instead of a room per stage. Characters sleep in bunks or rest in the
// rest corner when idle; with work they fetch the ticket card from the last
// station's tray (or the inbox), carry it to their own station, work, and leave
// it on their tray for the next one. Waiting for Faizuddin = card held up with
// a "!". Click a character or a card to open the ticket.
//
// Who does what comes from bigRoomEngine.ts (no React). Positions move every
// frame through refs (setAttribute in a requestAnimationFrame loop); React only
// re-renders when the engine's version or the depth order changes.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CHARACTER_INFO, backView, rectsFor } from "@/components/pipeline/CharacterSprite";
import {
  BOARD, Bubble, Candle, Fine, HAMMER_DOWN, INK, HAMMER_PAL, HAMMER_UP, Hero, MAP, MAP_DOTS, MAP_X, OpenBook,
  QUILL, ROOM_CSS, SPRITE_SCALE, Sleeper, Zzz, noHammer,
} from "@/components/pipeline/RoomScene";
import { RAIL_X, RoomBack, RoomPlates, roomProps, FONT } from "@/components/pipeline/BigRoomScenery";
import { needsYou } from "@/components/pipeline/StageList";
import {
  BENCH, BUNK, CHARACTERS, CHEST, DESK_TOP, DESK_X, FURNACE, NOTICE, ROOM_H, ROOM_W, RoomEngine, STATIONS,
  type Actor, type StationId,
} from "@/components/pipeline/bigRoomEngine";
import type { Character, PipelineJob, PipelineTicket } from "@/lib/pipeline/types";

/** A saved character state of "error" (a stopped step), whether or not a copy holds the card. */
const stopped = (t: PipelineTicket) => CHARACTERS.some(c => t.characters?.[c]?.state === "error");

const BLANKET: Record<Character, string> = {
  scout: "#2c662d", scribe: "#5a3478", elf: "#c9c4d8", dwarf: "#8e2a1f", sage: "#26348a",
};

const MODE_TEXT: Record<string, string> = {
  sleep: "asleep", walk: "walking", stand: "resting", tea: "having tea by the window", cook: "cooking",
  read: "reading in the armchair", look: "looking out of the window", wander: "stretching legs",
};

/** Cards waiting on a tray are drawn a little smaller, so they stay clear of the workers. */
const TRAY_S = 0.8;

/** Tray stacks in keyboard order: inbox first, done last. */
const STATION_ORDER = Object.keys(STATIONS) as StationId[];

/** "EAINT-12580" → "12580": the number is what fits on a card. */
const cardLabel = (key: string) => key.match(/(\d+)$/)?.[1] ?? key;

const actorName = (a: Actor) => `${CHARACTER_INFO[a.character].name}${a.slot > 1 ? ` ${a.slot}` : ""}`;

function actorTip(a: Actor): string {
  if (a.assign) {
    const what = a.assign.mode === "wait" ? "needs you" : a.assign.mode === "error" ? "stopped" : "working";
    return `${actorName(a)} ${what} · ${a.assign.key}: ${a.assign.activity}`;
  }
  return `${actorName(a)} is ${MODE_TEXT[a.mode] ?? "resting"}`;
}

const transformOf = (a: Actor) => a.mode === "sleep" ? undefined : `translate(${a.x.toFixed(2)},${a.y.toFixed(2)})`;

/** Sort depth (front edge y) of an actor: feet, or the bed it lies in. */
function depthOf(engine: RoomEngine, a: Actor): number {
  if (a.mode !== "sleep") return a.y;
  const bed = engine.bedOf(a.character, a.slot);
  return a.slot === 1 ? BUNK.bottom + 0.5 : bed.base;
}

/** The spot index an actor stands at, for which pin its card lies on. */
function spotAt(a: Actor, id: StationId): number {
  const s = STATIONS[id];
  let best = 0;
  let d = Infinity;
  s.spots.forEach((p, i) => { const e = Math.hypot(p.x - a.x, p.y - a.y); if (e < d) { d = e; best = i; } });
  return best;
}

// ── small pieces ────────────────────────────────────────────────────

/** Ticket card, top centre at (x, y). */
function Card({ x, y, label, s = 1, stopped }: { x: number; y: number; label: string; s?: number; stopped?: boolean }) {
  const w = 16 * s;
  const h = 8 * s;
  return (
    <g transform={`translate(${x - w / 2},${y})`}>
      <rect width={w} height={h} fill="#3a2410" />
      <rect x={0.5 * s} y={0.5 * s} width={w - s} height={h - s} fill={stopped ? "#f3d0c8" : "#f1e6c8"} />
      <rect x={0.5 * s} y={h - 1.5 * s} width={w - s} height={s} fill={stopped ? "#d8a8a0" : "#d8ccab"} />
      <rect x={1.2 * s} y={1.2 * s} width={1.4 * s} height={1.4 * s} fill="#b83a3a" />
      <text x={w / 2 + 0.6 * s} y={h * 0.7} textAnchor="middle" fontSize={4 * s} fontWeight={700} fill="#2a1a10" fontFamily={FONT}>
        {label}
      </text>
    </g>
  );
}

/** Rest-pose extras held in the hand (inside the facing flip). */
function RestKit({ mode }: { mode: Actor["mode"] }) {
  if (mode === "tea") {
    // r6 (2026-10-28): now and then the cup goes up for a sip.
    return (
      <g className="br-sip">
        <rect x={3} y={-8} width={2} height={2} fill="#f3ead2" />
        <g className="pr-fa"><rect x={3.5} y={-10} width={0.6} height={1.5} fill="#cfd6ff" opacity={0.7} /></g>
        <g className="pr-fb"><rect x={4.2} y={-10.5} width={0.6} height={1.5} fill="#cfd6ff" opacity={0.7} /></g>
      </g>
    );
  }
  if (mode === "read") {
    // A page turning every few seconds (the open book itself is drawn by ActorBody).
    return <g className="br-page"><rect x={-0.5} y={-7} width={3} height={3} fill="#fffaf0" /><rect x={-0.5} y={-7} width={3} height={0.6} fill="#c9b283" /></g>;
  }
  if (mode === "cook") {
    return (
      <g>
        <g className="pr-fa"><rect x={5} y={-11} width={0.8} height={6} fill="#8a5a33" /></g>
        <g className="pr-fb"><rect x={6.5} y={-11} width={0.8} height={6} fill="#8a5a33" /></g>
      </g>
    );
  }
  return null;
}

/** What a working character does with their hands, by character (sprite top-left at -6, -16). */
function WorkKit({ c, at }: { c: Character; at: StationId | null }) {
  const tx = -6;
  const ty = -16;
  if (c === "dwarf") {
    return (
      <g>
        <g className="pr-fa"><Fine rows={HAMMER_UP} pal={HAMMER_PAL} x={tx + 8} y={ty - 0.5} /></g>
        <g className="pr-fb">
          <Fine rows={HAMMER_DOWN} pal={HAMMER_PAL} x={tx + 9} y={ty + 2.5} />
          {at === "forge" && (
            <>
              <rect x={10} y={-9} width={1} height={1} fill="#ffe680" />
              <rect x={13} y={-11} width={1} height={1} fill="#ffb02e" />
              <rect x={15} y={-8} width={1} height={1} fill="#ffe680" />
              <rect x={12} y={-13} width={1} height={1} fill="#fff3b0" />
            </>
          )}
        </g>
      </g>
    );
  }
  if (c === "scout") {
    return (
      <g>
        <Fine rows={MAP.rows} pal={MAP.pal} x={tx} y={ty + 8.5} />
        <g className="pr-fa"><Fine rows={MAP_DOTS} pal={{ r: "#c0392b" }} x={tx + 2.5} y={ty + 12} /></g>
        <g className="pr-fb"><Fine rows={MAP_DOTS} pal={{ r: "#c0392b" }} x={tx + 4.5} y={ty + 12.5} /></g>
        <Fine rows={MAP_X} pal={{ r: "#c0392b" }} x={tx + 9} y={ty + 9.5} />
      </g>
    );
  }
  if (c === "elf") {
    return (
      <g>
        <Fine rows={BOARD.rows} pal={BOARD.pal} x={tx + 9.5} y={ty + 6} />
        <g className="pr-fa"><rect x={tx + 11} y={ty + 7.5} width={1} height={1} fill="#3f9c3a" /></g>
        <g className="pr-fb"><rect x={tx + 11} y={ty + 7.5} width={1} height={1} fill="#3f9c3a" /><rect x={tx + 11} y={ty + 9} width={1} height={1} fill="#3f9c3a" /></g>
        <g className="pr-quill"><Fine rows={QUILL.rows} pal={QUILL.pal} x={tx + 14} y={ty + 4.5} /></g>
      </g>
    );
  }
  // Scribe writes, the Sage reads: an open book on the desk. The Sage's lies
  // beside him so it does not hide his robe (2026-10-28).
  return (
    <g>
      <OpenBook x={c === "sage" ? tx + 9 : tx + 1} y={c === "sage" ? ty + 11 : ty + 9} />
      {c === "scribe" ? (
        <>
          <g className="pr-quill"><Fine rows={QUILL.rows} pal={QUILL.pal} x={tx + 8} y={ty + 5} /></g>
          <g className="pr-fa"><rect x={tx + 2.5} y={ty + 10.5} width={2} height={0.5} fill="#5a4a3a" /></g>
          <g className="pr-fb"><rect x={tx + 2.5} y={ty + 10.5} width={3} height={0.5} fill="#5a4a3a" /></g>
        </>
      ) : (
        <g className="pr-glow"><rect x={tx + 12} y={ty + 8} width={1} height={1} fill="#cfd6ff" /><rect x={tx + 16} y={ty + 7} width={1} height={1} fill="#cfd6ff" /><rect x={tx + 14} y={ty + 5} width={1} height={1} fill="#cfd6ff" /></g>
      )}
    </g>
  );
}

/** A character's body, drawn at its feet (the group is moved by the frame loop). */
function ActorBody({ engine, a }: { engine: RoomEngine; a: Actor }) {
  const c = a.character;
  if (a.mode === "sleep") {
    const bed = engine.bedOf(c, a.slot);
    return (
      <g>
        {a.slot > 1 && (
          <g>
            <rect x={bed.x - 2} y={bed.base - 2} width={22} height={3} fill="#7a2a2a" />
            <rect x={bed.x - 2} y={bed.base - 2} width={22} height={1} fill="#9c3a3a" />
            <rect x={bed.x - 3} y={bed.base - 4} width={5} height={3} fill="#d8ccab" />
          </g>
        )}
        <g className="pr-breathe"><Sleeper c={c} x={bed.x} base={bed.base} /></g>
        {/* blanket pulled up to the chest */}
        <rect x={bed.x + 7} y={bed.base - 7} width={12} height={7} fill={BLANKET[c]} />
        <rect x={bed.x + 8} y={bed.base - 8} width={10} height={1} fill={BLANKET[c]} />
        <rect x={bed.x + 7} y={bed.base - 7} width={2} height={7} fill="#f3ead2" opacity={0.85} />
      </g>
    );
  }
  const working = a.mode === "work" && !!a.assign;
  const sitting = a.mode === "read";
  const art = CHARACTER_INFO[c].art;
  const bare = working && c === "dwarf";
  return (
    <g className={a.mode === "walk" ? "br-walk" : undefined}>
      <g transform={a.facing === -1 ? "scale(-1,1)" : undefined}>
        {sitting
          ? <g transform={`translate(-6,-13) scale(${SPRITE_SCALE})`}>{rectsFor(art.rows, art.pal)}</g>
          : a.mode === "look"
            // Back to the room, looking out of the window (r7: was side-on).
            ? <g transform={`translate(-6,-16) scale(${SPRITE_SCALE})`}>{rectsFor(backView(c).rows, backView(c).pal)}</g>
          : bare
            ? <g transform={`translate(-6,-16) scale(${SPRITE_SCALE})`}>{rectsFor(art.rows, noHammer(art.pal))}</g>
            : <Hero c={c} x={-6} y={-16} />}
        {working && <WorkKit c={c} at={a.at} />}
        {/* sits 1 unit higher, book on the lap above the chair front (r6: at y -3 the chair hid it) */}
        {sitting && <OpenBook x={-5.5} y={-6} />}
        <RestKit mode={a.mode} />
      </g>
    </g>
  );
}

/** Above the darkness: the card in hand and the "!" / error bubble. */
function ActorOver({ a, showCard }: { a: Actor; showCard: boolean }) {
  const mode = a.assign && a.at === a.assign.station ? a.mode : null;
  const key = a.carrying;
  if (a.mode === "sleep") return null;
  if (mode === "wait") {
    // Two copies side by side hold their cards outward so both numbers show.
    const side = a.at && spotAt(a, a.at) === 0 && STATIONS[a.at].spots.length > 1 ? -1 : 1;
    const cx = side * 3;
    return (
      <g>
        {key && showCard && (
          <g className="pr-hover">
            <rect x={cx - 0.5} y={-20} width={1} height={4} fill="#3a2410" />
            <Card x={cx} y={-27} label={cardLabel(key)} s={0.85} />
          </g>
        )}
        {/* straight above the card: side bubbles ran into the next desk's bubble and tray badge */}
        <Bubble x={cx - 4.5} y={key && showCard ? -39 : -30} kind="waiting" />
      </g>
    );
  }
  if (mode === "error") return <Bubble x={4} y={-30} kind="error" />;
  if (!key || !showCard || a.character === "sage" || mode === "work") return null;
  return <Card x={a.facing * 3} y={-10} label={cardLabel(key)} s={0.7} />;
}

// ── lights ──────────────────────────────────────────────────────────

type Glow = "work" | "wait" | "error" | "idle";

/** Where each station's candle stands when nobody works there. */
const CANDLE: Partial<Record<StationId, [number, number]>> = {
  scout: [DESK_X.scout + 1, DESK_TOP - 5],
  scribe: [DESK_X.scribe + 13, DESK_TOP - 5],
  elf: [DESK_X.elf + 1, DESK_TOP - 5],
  sage: [DESK_X.sage + 1, DESK_TOP - 7],
  bench: [BENCH.x + 16, BENCH.top - 5],
  board: [NOTICE.x + 36, NOTICE.bottom - 8],
  done: [CHEST.x + 36, CHEST.top - 5],
};

/** Light pools cut out of the darkness (mask) per station state, plus fixed rest-corner lights. */
function holes(glow: Map<StationId, Glow>): { x: number; y: number; r: number; k: number }[] {
  const out: { x: number; y: number; r: number; k: number }[] = [];
  for (const [id, g] of glow) {
    const l = STATIONS[id].light;
    if (g === "work") out.push({ x: l.x, y: l.y, r: 34, k: 1 });
    else if (g === "wait" || g === "error") out.push({ x: l.x, y: l.y, r: 26, k: 0.85 });
    else {
      const c = CANDLE[id];
      if (c) out.push({ x: c[0] + 1, y: c[1], r: 12, k: 0.6 });
    }
  }
  // Rest corner: kitchen fire, reading lamp, moonlight; the forge always glows a little.
  out.push(
    { x: 318, y: 58, r: 26, k: 0.8 }, { x: 340, y: 84, r: 22, k: 0.7 }, { x: 270, y: 44, r: 30, k: 0.55 },
    { x: 330, y: 150, r: 30, k: 0.6 },
  );
  if (!glow.has("forge") || glow.get("forge") === "idle") out.push({ x: 11, y: 132, r: 14, k: 0.6 });
  return out;
}

function Lights({ glow }: { glow: Map<StationId, Glow> }) {
  const forgeHot = glow.get("forge") === "work";
  return (
    <g style={{ pointerEvents: "none" }}>
      {/* warm tint over lit stations */}
      {[...glow].map(([id, g]) => {
        const l = STATIONS[id].light;
        if (g === "idle") return null;
        const fill = g === "work" ? "url(#br-warm)" : g === "wait" ? "url(#br-amber)" : "url(#br-red)";
        return <ellipse key={id} cx={l.x} cy={l.y} rx={g === "work" ? 34 : 24} ry={g === "work" ? 26 : 18} fill={fill} className="pr-glow-slow" style={{ mixBlendMode: "screen" }} />;
      })}
      {[...glow].map(([id, g]) => {
        const c = CANDLE[id];
        return g === "idle" && c ? <Candle key={id} x={c[0]} y={c[1]} /> : null;
      })}
      {/* forge fire */}
      {forgeHot ? (
        <g className="pr-flame">
          <rect x={FURNACE.x + 4} y={FURNACE.y + 22} width={10} height={7} fill="#e0561c" />
          <rect x={FURNACE.x + 6} y={FURNACE.y + 20} width={6} height={4} fill="#ffb02e" />
          <rect x={FURNACE.x + 8} y={FURNACE.y + 19} width={2} height={2} fill="#ffe680" />
        </g>
      ) : (
        <g>
          <rect x={FURNACE.x + 5} y={FURNACE.y + 27} width={8} height={2} fill="#7a2a14" />
          <rect x={FURNACE.x + 7} y={FURNACE.y + 27} width={1} height={1} fill="#e0561c" />
          <rect x={FURNACE.x + 10} y={FURNACE.y + 28} width={1} height={1} fill="#e0561c" />
        </g>
      )}
      {/* kitchen fire under the pot, steam */}
      <g className="pr-flame">
        <rect x={313} y={58} width={12} height={6} fill="#e0561c" />
        <rect x={315} y={56} width={8} height={3} fill="#ffb02e" />
        <rect x={318} y={55} width={2} height={2} fill="#ffe680" />
      </g>
      {/* steam curling up from the pot and the teapot spout (r6, 2026-10-28) */}
      {[[315, 44, 0], [319, 43, 1.1], [322, 44, 2.2], [273.5, 75, 0.6], [274.5, 74.5, 2]].map(([x, y, d]) => (
        <g key={`${x}-${y}`} className="br-steam" style={{ animationDelay: `${d}s` }}>
          <rect x={x} y={y} width={1} height={2} fill="#dfe4f0" />
        </g>
      ))}
      {/* night candle on the stool by the bunks, with a small flickering halo */}
      <ellipse cx={345.5} cy={148} rx={9} ry={7} fill="url(#br-warm)" className="pr-glow" style={{ mixBlendMode: "screen" }} />
      <Candle x={344} y={150} />
      {/* reading lamp on the bookcase side, and the lantern by the inbox door */}
      <rect x={333} y={74} width={1} height={26} fill="#3a2a1c" />
      <rect x={330} y={70} width={7} height={4} fill="#c8963a" />
      <rect x={331} y={74} width={5} height={1} fill="#ffe680" />
      <ellipse cx={334} cy={80} rx={20} ry={16} fill="url(#br-warm)" style={{ mixBlendMode: "screen" }} />
      <ellipse cx={318} cy={58} rx={22} ry={16} fill="url(#br-warm)" className="pr-glow" style={{ mixBlendMode: "screen" }} />
      <ellipse cx={270} cy={30} rx={26} ry={24} fill="url(#br-moon)" style={{ mixBlendMode: "screen" }} />
      <g>
        <rect x={24} y={24} width={3} height={4} fill="#ffcf4a" className="pr-glow" />
        <rect x={23} y={23} width={5} height={1} fill="#3a2a1c" />
        <rect x={23} y={28} width={5} height={1} fill="#3a2a1c" />
      </g>
    </g>
  );
}

// ── the room ────────────────────────────────────────────────────────

type Tip = { x: number; y: number; text: string } | null;
/** The open card-stack list: every card waiting on one tray (2026-10-28: a click used to open only the top one). */
type Pick = { x: number; y: number; label: string; list: PipelineTicket[] } | null;

export default function BigRoom({ tickets, jobs }: { tickets: PipelineTicket[]; jobs: PipelineJob[] }) {
  const router = useRouter();
  const [engine] = useState(() => new RoomEngine());
  const [, setFrame] = useState(0);
  const [height, setHeight] = useState(560);
  const [phone, setPhone] = useState(false);
  const [tip, setTip] = useState<Tip>(null);
  const [pick, setPick] = useState<Pick>(null);
  /** Phones: a "swipe" hint until the room is first panned. */
  const [panned, setPanned] = useState(false);
  const pickRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const bodies = useRef(new Map<string, SVGGElement>());
  const overs = useRef(new Map<string, SVGGElement>());
  const props = useMemo(() => roomProps(), []);

  // The stack list closes on Escape or a click anywhere else; it takes focus when it opens.
  useEffect(() => {
    if (!pick) return;
    pickRef.current?.querySelector("a")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPick(null); };
    const onDown = (e: PointerEvent) => { if (!pickRef.current?.contains(e.target as Node)) setPick(null); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown, true); };
  }, [pick]);

  // Data in: the engine decides who works where; the frame loop shows it.
  useEffect(() => { engine.update(tickets, jobs); }, [engine, tickets, jobs]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => engine.setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [engine]);

  // Height: the room fills what is left of <main> below the page header, so
  // it fits without a scroll (2026-10-28: the old 60% floor pushed its bottom
  // off screen when the "Needs you" box was tall). Phones pan sideways; their
  // room also fits under the header (300 px to 70vh; r5, 2026-10-28: a fixed
  // 70vh room ended 130 to 180 px below the first screen).
  useEffect(() => {
    const wrap = wrapRef.current;
    const main = wrap?.closest("main");
    if (!wrap || !main) return;
    const measure = () => {
      const small = window.matchMedia("(max-width: 767px)").matches;
      setPhone(small);
      const top = wrap.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
      const h = main.clientHeight;
      if (small) { setHeight(Math.round(Math.min(window.innerHeight * 0.7, Math.max(h - top - 16, 300)))); return; }
      setHeight(Math.round(Math.max(h - top - 24, 340)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(main);
    if (main.firstElementChild) ro.observe(main.firstElementChild);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // Phones open on the busy part of the room, not always the inbox end (r5,
  // 2026-10-28): centre on whoever needs Faizuddin, else on whoever works.
  // Never after the room has been panned by hand.
  const autoLeft = useRef<number | null>(null);
  const autoH = useRef(0);
  useEffect(() => {
    const wrap = wrapRef.current;
    // Again when the height settles (the room widens with it), until panned by hand.
    if (!phone || !wrap || (autoLeft.current !== null && autoH.current === height) || panned || !tickets.length) return;
    autoH.current = height;
    const busy = [...engine.actors.values()].filter(a => a.assign);
    const pickMode = (["wait", "error", "work"] as const).find(m => busy.some(a => a.assign!.mode === m));
    if (!pickMode) { autoLeft.current = 0; return; }
    const xs = busy.filter(a => a.assign!.mode === pickMode).map(a => STATIONS[a.assign!.station].light.x);
    const mid = xs.reduce((s, x) => s + x, 0) / xs.length;
    const scale = height / ROOM_H;
    const left = Math.max(0, Math.min(mid * scale - wrap.clientWidth / 2, wrap.scrollWidth - wrap.clientWidth));
    autoLeft.current = left;
    wrap.scrollLeft = left;
  }, [phone, height, tickets, engine, panned]);

  // Frame loop: move groups directly; re-render only on engine changes or a new depth order.
  // r8 (2026-10-28), CPU: a transform is written only when it changed, the depth
  // order is worked out only after a move, the loop drops to ~7 checks a second
  // while nobody walks, and it stops while the tab is hidden.
  useEffect(() => {
    let raf = 0;
    let timer = 0;
    let last = performance.now();
    let seenVersion = -1;
    let seenOrder = "";
    const written = new Map<string, string>();
    const loop = (now: number) => {
      raf = 0;
      const dt = Math.min(100, now - last);
      last = now;
      const moved = engine.tick(now, dt);
      let changed = false;
      for (const a of engine.actors.values()) {
        if (!a.visible) continue;
        const t = transformOf(a);
        if (t && written.get(a.id) !== t) {
          written.set(a.id, t);
          changed = true;
          bodies.current.get(a.id)?.setAttribute("transform", t);
          overs.current.get(a.id)?.setAttribute("transform", t);
        }
      }
      if (changed || engine.version !== seenVersion) {
        const order: [string, number][] = [];
        for (const a of engine.actors.values()) if (a.visible) order.push([a.id, depthOf(engine, a)]);
        // Depth order only matters against props and each other: bucket by the prop depths crossed.
        const sig = order.map(([id, d]) => `${id}:${props.filter(p => p.depth < d).length}`).join("|")
          + "/" + order.sort((x, y) => x[1] - y[1]).map(x => x[0]).join(",");
        if (engine.version !== seenVersion || sig !== seenOrder) {
          seenVersion = engine.version;
          seenOrder = sig;
          setFrame(f => f + 1);
        }
      }
      if (moved || changed) raf = requestAnimationFrame(loop);
      else timer = window.setTimeout(() => { timer = 0; raf = requestAnimationFrame(loop); }, 150);
    };
    const start = () => {
      if (raf || timer || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      raf = 0;
      timer = 0;
    };
    const onVisible = () => { if (document.hidden) stop(); else start(); };
    document.addEventListener("visibilitychange", onVisible);
    start();
    return () => { stop(); document.removeEventListener("visibilitychange", onVisible); };
  }, [engine, props]);

  function showTip(e: ReactPointerEvent, text: string) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r || !wrapRef.current) return;
    setTip({ x: e.clientX - r.left + wrapRef.current.scrollLeft, y: e.clientY - r.top, text });
  }
  /** Room (SVG) units → a spot inside the scrolling box. */
  function boxPoint(x: number, y: number): { x: number; y: number } | null {
    const wrap = wrapRef.current;
    const m = wrap?.querySelector("svg")?.getScreenCTM();
    if (!wrap || !m) return null;
    const r = wrap.getBoundingClientRect();
    return { x: m.a * x + m.e - r.left + wrap.scrollLeft, y: m.d * y + m.f - r.top };
  }
  /** Keyboard focus shows the same tooltip as hover (r10, 2026-10-28). */
  function focusTip(x: number, y: number, text: string) {
    const p = boxPoint(x, y);
    if (p) setTip({ x: p.x, y: p.y, text });
  }
  const open = (key: string) => router.push(`/pipeline/${key}`);

  /** One card: open it. A stack: list every card next to it. */
  function openStack(id: StationId, list: PipelineTicket[], at: { clientX: number; clientY: number } | null) {
    if (list.length === 1) { open(list[0].key); return; }
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    let x = 0;
    let y = 0;
    if (at) { x = at.clientX - r.left + wrap.scrollLeft; y = at.clientY - r.top; }
    else {
      const p = boxPoint(STATIONS[id].tray.x, STATIONS[id].tray.y);
      if (p) { x = p.x; y = p.y; }
    }
    // Keep the list inside the room box (it clips overflow).
    const left = Math.max(4, Math.min(x + 8, wrap.scrollLeft + wrap.clientWidth - 264));
    const top = Math.max(4, Math.min(y + 8, wrap.clientHeight - 34 - Math.min(list.length, 8) * 22));
    setTip(null);
    setPick({ x: left, y: top, label: STATIONS[id].label, list: list.slice().reverse() });
  }

  // ── what to draw this render ──
  const actors = [...engine.actors.values()].filter(a => a.visible);
  const glow = new Map<StationId, Glow>();
  for (const id of ["scout", "scribe", "elf", "sage", "forge", "bench", "board", "done"] as StationId[]) glow.set(id, "idle");
  const rank: Record<Glow, number> = { work: 3, wait: 2, error: 1, idle: 0 };
  for (const a of actors) {
    if (!a.assign || a.at !== a.assign.station) continue;
    const g: Glow = a.mode === "work" ? "work" : a.mode === "wait" ? "wait" : a.mode === "error" ? "error" : "idle";
    if (rank[g] > rank[glow.get(a.at) ?? "idle"]) glow.set(a.at, g);
  }
  // One card per ticket: the first carrier shows it; a second copy on the same ticket does not.
  const cardBy = new Map<string, string>();
  for (const a of actors) {
    if (a.carrying && a.character !== "sage" && !cardBy.has(a.carrying)) cardBy.set(a.carrying, a.id);
  }
  // Cards nobody carries wait on their station's tray, newest on top.
  const trays = new Map<StationId, PipelineTicket[]>();
  for (const t of [...tickets].sort((x, y) => String(x.updatedAt).localeCompare(String(y.updatedAt)))) {
    if (cardBy.has(t.key)) continue;
    const id = engine.restStation(t.key);
    trays.set(id, [...(trays.get(id) ?? []), t]);
  }
  if ((trays.get("door")?.length ?? 0) > 0) glow.set("door", "wait");

  const items: { id: string; depth: number; node: ReactNode }[] = [...props];
  for (const a of actors) {
    items.push({
      id: a.id,
      depth: depthOf(engine, a),
      node: (
        <g
          ref={el => { if (el) bodies.current.set(a.id, el); else bodies.current.delete(a.id); }}
          transform={transformOf(a)}
          className={a.assign ? "br-hit br-link" : "br-hit"}
          onPointerEnter={e => showTip(e, actorTip(a))}
          onPointerLeave={() => setTip(null)}
          onClick={() => { if (a.assign) router.push(`/pipeline/${a.assign.key}`); }}
        >
          <ActorBody engine={engine} a={a} />
        </g>
      ),
    });
  }
  items.sort((x, y) => x.depth - y.depth);

  const workingCount = actors.filter(a => a.assign).length;
  const summary = workingCount
    ? actors.filter(a => a.assign).map(actorTip).join(". ")
    : "Everyone is resting";
  const width = phone ? Math.round(height * ROOM_W / ROOM_H) : undefined;

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        className="pr-board br-wrap relative rounded-xl overflow-x-auto overflow-y-hidden"
        style={{ height, background: "#0c0f1c", border: "1px solid #24170f" }}
        onScroll={e => {
          // The phone's opening pan (autoLeft) is not a hand pan: the swipe hint stays until he moves the room.
          if (!panned && Math.abs(e.currentTarget.scrollLeft - (autoLeft.current ?? 0)) > 20) setPanned(true);
          setPick(null); setTip(null);
        }}
      >
        <style>{ROOM_CSS + BIG_CSS}</style>
        <svg
          viewBox={`0 0 ${ROOM_W} ${ROOM_H}`}
          preserveAspectRatio="xMidYMid meet"
          shapeRendering="crispEdges"
          className="pr-svg block"
          style={{ width: width ?? "100%", height }}
          role="img"
          aria-label={`Pipeline room. ${summary}.`}
        >
          <defs>
            <radialGradient id="br-hole">
              <stop offset="0" stopColor="#000" stopOpacity="1" />
              <stop offset="0.55" stopColor="#000" stopOpacity="0.7" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="br-warm">
              <stop offset="0" stopColor="#ffd27a" stopOpacity="0.3" />
              <stop offset="0.5" stopColor="#ffa040" stopOpacity="0.12" />
              <stop offset="1" stopColor="#ff8a20" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="br-amber">
              <stop offset="0" stopColor="#ffe08a" stopOpacity="0.32" />
              <stop offset="1" stopColor="#ffcf4a" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="br-red">
              <stop offset="0" stopColor="#ff7a6a" stopOpacity="0.3" />
              <stop offset="1" stopColor="#e05252" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="br-moon">
              <stop offset="0" stopColor="#9ab0ff" stopOpacity="0.16" />
              <stop offset="1" stopColor="#9ab0ff" stopOpacity="0" />
            </radialGradient>
            <mask id="br-dark-mask" maskUnits="userSpaceOnUse" x={-700} y={-700} width={ROOM_W + 1400} height={ROOM_H + 1400}>
              <rect x={-700} y={-700} width={ROOM_W + 1400} height={ROOM_H + 1400} fill="#fff" />
              {holes(glow).map((h, i) => (
                <ellipse key={i} cx={h.x} cy={h.y} rx={h.r} ry={h.r * 0.78} fill="url(#br-hole)" opacity={h.k} />
              ))}
            </mask>
          </defs>

          <RoomBack />
          {items.map(it => <g key={it.id}>{it.node}</g>)}

          {/* night: the hall darker than the rest corner; lights cut through */}
          <g mask="url(#br-dark-mask)" style={{ pointerEvents: "none" }}>
            <rect x={-700} y={-700} width={RAIL_X + 700} height={ROOM_H + 1400} fill="#060a1c" opacity={0.55} />
            <rect x={RAIL_X} y={-700} width={ROOM_W - RAIL_X + 700} height={ROOM_H + 1400} fill="#060a1c" opacity={0.38} />
          </g>
          <Lights glow={glow} />
          <RoomPlates />

          {/* cards waiting on trays */}
          {/* station order, so Tab walks the trays inbox → done (r10: was by ticket age) */}
          {[...trays].sort((x, y) => STATION_ORDER.indexOf(x[0]) - STATION_ORDER.indexOf(y[0])).map(([id, list]) => {
            const st = STATIONS[id];
            const shown = list.slice(-3);
            const top = list[list.length - 1];
            const more = list.length - shown.length;
            // Tag spots: right of the stack; at the bench the findings board starts
            // there (r5), so "+N" sits on the bench front below and "!" above the cards.
            const tags = id === "bench"
              ? { bang: [st.tray.x - 2.5, st.tray.y - TRAY_S * 8 - 2 * 1.4 - 7], more: [st.tray.x - 4, st.tray.y + 0.8] }
              // Desks (r7, 2026-10-28): "+N" on the desk front under the stack, so
              // "!" and "+N" no longer stack up in the gap before the next worker.
              : st.tray.y === DESK_TOP
                ? { bang: [st.tray.x + 6.5, st.tray.y - 11], more: [st.tray.x - 4, st.tray.y + 2.5] }
                : { bang: [st.tray.x + 7.5, st.tray.y - 13], more: [st.tray.x + 7.5, st.tray.y - 6] };
            const text = list.slice().reverse().slice(0, 6).map(t => `${needsYou(t) ? "(!) " : stopped(t) ? "(stopped) " : ""}${t.key}${t.title ? ` · ${t.title}` : ""}`).join("\n")
              + (list.length > 6 ? `\n+${list.length - 6} more` : "");
            return (
              <g
                key={id}
                className="br-hit br-link"
                role="link"
                tabIndex={0}
                aria-label={list.length === 1 ? `Open ${top.key}` : `${list.length} cards at ${st.label}: choose one`}
                onClick={e => openStack(id, list, e)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStack(id, list, null); } }}
                onPointerEnter={e => showTip(e, text)}
                onFocus={() => focusTip(st.tray.x + 6, st.tray.y - 4, text)}
                onBlur={() => setTip(null)}
                onPointerLeave={() => setTip(null)}
              >
                {/* a small stack leaning right, away from whoever works at the station */}
                {shown.map((t, i) => (
                  <Card key={t.key} x={st.tray.x + i * 0.8} y={st.tray.y - TRAY_S * 8 - i * 1.4} label={cardLabel(t.key)} s={TRAY_S} />
                ))}
                {/* A card here needs Faizuddin and nobody is holding it up (a third
                    waiting ticket for a character, or a failed run on the board):
                    a small amber "!" tag on the stack (2026-10-28). */}
                {list.some(needsYou) && (
                  <g transform={`translate(${tags.bang[0]},${tags.bang[1]})`}>
                    <g className="pr-hover">
                      <rect x={0} y={0} width={5} height={6} fill={INK} />
                      <rect x={0.5} y={0.5} width={4} height={5} fill="#ffcf4a" />
                      <rect x={2} y={1} width={1} height={2.5} fill={INK} />
                      <rect x={2} y={4} width={1} height={1} fill={INK} />
                    </g>
                  </g>
                )}
                {/* r8 (2026-10-28): a stopped ticket nobody holds (both copies busy)
                    had no sign in the room; a small red "x" tag, unless "!" is there. */}
                {!list.some(needsYou) && list.some(stopped) && (
                  <g transform={`translate(${tags.bang[0]},${tags.bang[1]})`}>
                    <g className="pr-hover">
                      <rect x={0} y={0} width={5} height={6} fill={INK} />
                      <rect x={0.5} y={0.5} width={4} height={5} fill="#d8443a" />
                      <rect x={1.2} y={1.5} width={1} height={1} fill="#fff3d0" />
                      <rect x={2.8} y={1.5} width={1} height={1} fill="#fff3d0" />
                      <rect x={2} y={2.5} width={1} height={1} fill="#fff3d0" />
                      <rect x={1.2} y={3.5} width={1} height={1} fill="#fff3d0" />
                      <rect x={2.8} y={3.5} width={1} height={1} fill="#fff3d0" />
                    </g>
                  </g>
                )}
                {/* "+N" tag beside the stack (above it, it read as part of a "!" bubble) */}
                {more > 0 && (
                  <g transform={`translate(${tags.more[0]},${tags.more[1]})`}>
                    <rect x={0} y={0} width={8} height={4.6} fill="#24170f" />
                    <rect x={0.3} y={0.3} width={7.4} height={4} fill="#b8742a" />
                    <text x={4} y={3.5} textAnchor="middle" fontSize={3.2} fontWeight={700} fill="#fff3d0" fontFamily={FONT}>+{more}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* cards being worked on, lying at the worker's spot */}
          {actors.map(a => {
            if (!a.assign || a.at !== a.assign.station || !a.carrying || cardBy.get(a.carrying) !== a.id) return null;
            if (a.mode !== "work" && a.mode !== "error") return null;
            const pin = STATIONS[a.at].pins[spotAt(a, a.at)];
            const key = a.carrying;
            return (
              <g key={`pin-${a.id}`} className="br-hit br-link" onClick={() => open(key)}
                onPointerEnter={e => showTip(e, actorTip(a))} onPointerLeave={() => setTip(null)}>
                <Card x={pin.x} y={pin.y} label={cardLabel(key)} s={0.62} stopped={a.mode === "error"} />
              </g>
            );
          })}

          {/* per-character overlay: card in hand, "!" bubbles, Zzz. A busy
              character is a keyboard stop here (r10, 2026-10-28: only tray stacks
              were reachable). This layer keeps a fixed order (by character, then
              copy), so Tab does not jump as people walk and the depth order changes. */}
          {[...actors].sort((x, y) => CHARACTERS.indexOf(x.character) - CHARACTERS.indexOf(y.character) || x.slot - y.slot).map(a => (
            a.mode === "sleep" ? (
              <g key={`over-${a.id}`} style={{ pointerEvents: "none" }}>
                <Zzz x={engine.bedOf(a.character, a.slot).x + 8} y={engine.bedOf(a.character, a.slot).base - 16} />
              </g>
            ) : (
              <g
                key={`over-${a.id}`}
                ref={el => { if (el) overs.current.set(a.id, el); else overs.current.delete(a.id); }}
                transform={transformOf(a)}
                className={a.assign ? "br-hit br-link br-actor" : undefined}
                onClick={() => { if (a.assign) open(a.assign.key); }}
                onPointerEnter={e => showTip(e, actorTip(a))}
                onPointerLeave={() => setTip(null)}
                {...(a.assign ? {
                  role: "link",
                  tabIndex: 0,
                  "aria-label": actorTip(a),
                  onKeyDown: (e: ReactKeyboardEvent) => {
                    if (a.assign && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(a.assign.key); }
                  },
                  onFocus: () => focusTip(a.x + 6, a.y - 8, actorTip(a)),
                  onBlur: () => setTip(null),
                } : {})}
              >
                {/* focus ring around the body (hidden until keyboard focus) */}
                {a.assign && <rect className="br-ring" x={-7.5} y={-17.5} width={15} height={18.5} fill="none" style={{ pointerEvents: "none" }} />}
                <ActorOver a={a} showCard={!!a.carrying && cardBy.get(a.carrying) === a.id} />
              </g>
            )
          ))}
        </svg>
        {tip && (
          <div
            className="br-tip pointer-events-none absolute z-10 max-w-xs whitespace-pre-line rounded-md px-2 py-1 text-[11px] leading-4"
            style={{ left: tip.x + 12, top: tip.y + 12 }}
          >
            {tip.text}
          </div>
        )}
        {pick && (
          <div
            ref={pickRef}
            role="dialog"
            aria-label={`Cards at ${pick.label}`}
            className="br-tip absolute z-20 w-64 max-w-[80vw] rounded-md p-1.5 text-[11px] leading-4"
            style={{ left: pick.x, top: pick.y }}
          >
            <p className="px-1 pb-1 font-semibold text-[#e8d9a8]">{pick.label} · {pick.list.length} cards</p>
            <ol className="max-h-48 overflow-y-auto">
              {pick.list.map(t => (
                <li key={t.key}>
                  <Link
                    href={`/pipeline/${t.key}`}
                    className="flex gap-1.5 rounded px-1 py-0.5 hover:bg-[#3a2410] focus:bg-[#3a2410] focus:outline-none"
                  >
                    <span className="font-mono whitespace-nowrap text-[#ffcf4a]">{t.key}</span>
                    <span className="truncate text-[#ffdcaa]">{t.title || "No title yet"}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      {/* Phones: the swipe hint sits outside the scrolling room, top right of what
          is on screen (r9, 2026-10-28: top left it covered the "Inbox" sign, and
          inside the room it had to follow the scroll; r8 cut it off). */}
      {phone && !panned && (
        <p className="br-tip pointer-events-none absolute right-2 top-2 z-10 whitespace-nowrap rounded-md px-2 py-1 text-[11px]">
          Swipe sideways for the whole room →
        </p>
      )}
    </div>
  );
}

export const BIG_CSS = `
.br-wrap { scrollbar-width: thin; scrollbar-color: #3a2a1c #0c0f1c; }
.br-hit { cursor: default; }
.br-link { cursor: pointer; }
.br-link:focus { outline: none; }
.br-link:focus-visible > g > rect:first-child { stroke: #ffcf4a; stroke-width: .9; }
.br-ring { stroke: none; }
.br-actor:focus-visible .br-ring { stroke: #ffcf4a; stroke-width: .7; stroke-dasharray: 2 1; }
.br-tip { background: #1a1210; color: #ffdcaa; border: 1px solid #6b4426; box-shadow: 0 4px 12px rgba(0,0,0,.5); }
.br-walk { animation: br-walk .32s steps(1, end) infinite; }
@keyframes br-walk { 0% { transform: translateY(0) } 50% { transform: translateY(-.6px) } }
/* r6 charm (2026-10-28): stepped, small, hidden under reduced motion (base opacity 0). */
.br-steam { opacity: 0; animation: br-steam 3.3s steps(6, end) infinite; }
@keyframes br-steam { 0% { opacity: 0; transform: translate(0, 0) } 15% { opacity: .55 } 60% { opacity: .35; transform: translate(1px, -5px) } 100% { opacity: 0; transform: translate(0, -9px) } }
.br-sip { animation: br-sip 5s steps(1, end) infinite; }
@keyframes br-sip { 0% { transform: translate(0, 0) } 70% { transform: translate(-1px, -3px) } 86% { transform: translate(0, 0) } }
.br-page { opacity: 0; animation: br-page 6s steps(1, end) infinite; }
@keyframes br-page { 0% { opacity: 0 } 88% { opacity: 1 } 94% { opacity: 0 } }
.br-star { opacity: 0; animation: br-star 13s linear infinite; }
@keyframes br-star { 0%, 90% { opacity: 0; transform: translate(0, 0) } 91% { opacity: 1; transform: translate(0, 0) } 95% { opacity: 0; transform: translate(-13px, 5px) } 100% { opacity: 0; transform: translate(-13px, 5px) } }
.br-tail-a { animation: br-tail-a 7s steps(1, end) infinite; }
.br-tail-b { opacity: 0; animation: br-tail-b 7s steps(1, end) infinite; }
@keyframes br-tail-a { 0% { opacity: 1 } 80% { opacity: 0 } 86% { opacity: 1 } }
@keyframes br-tail-b { 0% { opacity: 0 } 80% { opacity: 1 } 86% { opacity: 0 } }
.br-cat { animation: pr-breathe 3.2s steps(1, end) infinite; }
`;
