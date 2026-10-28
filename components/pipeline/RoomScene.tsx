"use client";
// Pixel props and room animations for the big room on the pipeline board
// (BigRoom.tsx, BigRoomScenery.tsx). Started as one small scene per stage
// column (2026-10-27); the per-stage scene was removed on 2026-10-28 once the
// big room replaced it. Same text-grid / crisp-rect approach as app/agents/page.tsx.
import clsx from "clsx";
import { ART_W, CHARACTER_INFO, HAMMER_KEYS, closedEyes, rectsFor } from "@/components/pipeline/CharacterSprite";
import type { Character } from "@/lib/pipeline/types";

type Palette = Record<string, string>;
export const INK = "#1b1b24";

export const GLYPH_Z = ["kkkk", "..k.", ".k..", "kkkk"];
export const GLYPH_BANG = ["k", "k", "k", ".", "k"];
export const GLYPH_X = ["k...k", ".k.k.", "..k..", ".k.k.", "k...k"];

export function Grid({ rows, pal, x = 0, y = 0 }: { rows: string[]; pal: Palette; x?: number; y?: number }) {
  return <g transform={`translate(${x},${y})`}>{rectsFor(rows, pal)}</g>;
}

/** Sprites are 24 x 32 art pixels drawn into the old 12 x 16 room-unit box. */
export const SPRITE_SCALE = 12 / ART_W;

/** A prop drawn at the sprites' finer scale (one char = half a room unit). */
export function Fine({ rows, pal, x, y }: { rows: string[]; pal: Palette; x: number; y: number }) {
  return <g transform={`translate(${x},${y}) scale(${SPRITE_SCALE})`}>{rectsFor(rows, pal)}</g>;
}

// ── props at the finer scale ────────────────────────────────

export const QUILL = {
  rows: ["......qq", ".....qqQ", "....qqQ.", "...qqQ..", "...qQ...", "..qQ....", "..s.....", ".s......", "k......."],
  pal: { q: "#f8f8f8", Q: "#c3c3d2", s: "#8a8a9a", k: INK },
};

/** Scout's open map, held at both edges. */
export const MAP = {
  rows: [
    ".EEEEEEEEEEEEEEEEEEEEEE.",
    "EPppppppppppppppppppppPE",
    "EPpgggppppwppppppmmpppPE",
    "EPgggGgpppwwppppmMmmppPE",
    "zPpgGggppppwwpppppppppPz",
    "SPppgppppppppwwppGgggpPS",
    "EPpppppppppppwwgGGggppPE",
    "EPpppppppppppwggGgppppPE",
    "EPpppppppppppwpppppppPPE",
    "EPPPPPPPPPPPPPPPPPPPPPPE",
    ".EEEEEEEEEEEEEEEEEEEEEE.",
  ],
  pal: {
    E: "#8a6a3a", P: "#c9b283", p: "#e8d9a8", g: "#5d9e48", G: "#3f7a32", w: "#4a8ad0",
    m: "#a08060", M: "#6b5030", z: "#ffe3c4", S: "#d6966a",
  },
};
export const MAP_X = ["r.r", ".r.", "r.r"];
export const MAP_DOTS = ["r.r.r"];

/** The Elf's clipboard checklist, held at its left edge. */
export const BOARD = {
  rows: [
    "......cccc......",
    ".BbbbbcCCcbbbbB.",
    ".bppppppppppppB.",
    ".bpxxpllllllppB.",
    ".bpxxppppppppqB.",
    ".bppppppppppppB.",
    ".bpxxpllllppppB.",
    ".bpxxppppppppqB.",
    "ssppppppppppppB.",
    "Sspxxpllllllp.B.",
    ".bpxxpppppppqqB.",
    ".bppppppppppppB.",
    ".bpxxplllllpppB.",
    ".bpxxppppppppqB.",
    ".bppppppppppqqB.",
    ".BBBBBBBBBBBBBB.",
  ],
  pal: {
    c: "#9aa3ad", C: "#6b7480", B: "#4a2f18", b: "#8a5a33", p: "#f1e6c8", q: "#d8ccab",
    x: "#9a8a6a", l: "#b0a080", s: "#f4c79c", S: "#d6966a",
  },
};

export const HAMMER_PAL = { K: "#2a3038", I: "#e4e9ef", H: "#a6b0bb", J: "#5f6976", L: "#3a2410", h: "#8a5a2e", f: "#5a3a1a" };
/** The Dwarf's war hammer raised (head up) and brought down (head on the anvil). */
export const HAMMER_UP = [
  ".KKKKKKKKKK.",
  "KIIIIIIIHHJK",
  "KIHHHHHHHHJK",
  "KJJJJJJJJJJK",
  "KIHHHHHHHJJK",
  ".KKKKKKKKKK.",
  "....LhfL....",
  "....LhfL....",
  "....LhfL....",
  "....LhfL....",
  "....LhfL....",
  "....LhfL....",
  "....LhfL....",
  "....LffL....",
  "....LhfL....",
  "....LffL....",
  "....LhfL....",
  "....LIJL....",
  ".....LL.....",
];
export const HAMMER_DOWN = [
  "...............KKKK...",
  "..............KIIHJK..",
  "..............KIHHJK..",
  "..............KIHHJK..",
  "..............KJJJJK..",
  "............LLKIHHJK..",
  "..........LLhhKIHHJK..",
  "........LLhhffKIHHJK..",
  ".......LhhhfLLKIHJJK..",
  ".....LLhhffL..KJJJJK..",
  "...LLhhffLL....KKKK...",
  ".LLhhffLL.............",
  "LhhhfLL...............",
  "LfffL.................",
];
export const ANVIL = {
  rows: [
    "......MMMMMMMMMMMMMMMMMMMMMMMMMMMK",
    "MMMMMMmmmmmmmmmmmmmmmmmmmmmmmmmmnK",
    ".nnmmmmmmmmmmmmmmmmmmmmmmmmmmmmnnK",
    "...nnNnnnnnnnnnnnnnnnnnnnnnnnnnNNK",
    "........NNNNnnnnnnnnnnnnnnnNNN....",
    "............NmmmmmmmmmmmmnnN......",
    "............NmmmmmmmmmmmmnnN......",
    "............NmmmmmmmmmmmnnnN......",
    "...........NmmmmmmmmmmmmmnnNN.....",
    "..........NmmmmmmmmmmmmmmmnnN.....",
    "........NMmmmmmmmmmmmmmmmmmmnnN...",
    "........NMmmmmmmmmmmmmmmmmmmnnNK..",
    "........NnnnnnnnnnnnnnnnnnnnnNNK..",
    "........NnnnnnnnnnnnnnnnnnnnnNNK..",
    "........NnnnnnnnnnnnnnnnnnnnnNNK..",
    "........NnnnnnnnnnnnnnnnnnnnnNNK..",
    "........NNNNNNNNNNNNNNNNNNNNNNNK..",
    "........KKKKKKKKKKKKKKKKKKKKKKKK..",
  ],
  pal: { M: "#c4cad2", m: "#8a939e", n: "#6b7480", N: "#4a525c", K: "#2a3038" },
};

/** The sprite palette without the Dwarf's hammer, for scenes that draw their own. */
export function noHammer(pal: Palette): Palette {
  return Object.fromEntries(Object.entries(pal).filter(([k]) => !HAMMER_KEYS.includes(k)));
}

/** A character sprite; `asleep` closes the eyes; `bareHanded` drops a held tool. */
export function Hero({ c, x, y, asleep, bareHanded }: { c: Character; x: number; y: number; asleep?: boolean; bareHanded?: boolean }) {
  const art = CHARACTER_INFO[c].art;
  let pal = asleep ? closedEyes(art.pal) : art.pal;
  if (bareHanded) pal = noHammer(pal);
  return <Fine rows={art.rows} pal={pal} x={x} y={y} />;
}

/** Lying down: head to the left, feet to the right, resting on y = base. */
export function Sleeper({ c, x, base }: { c: Character; x: number; base: number }) {
  const art = CHARACTER_INFO[c].art;
  return (
    <g transform={`translate(${x},${base}) rotate(-90) scale(${SPRITE_SCALE})`}>
      {rectsFor(art.rows, noHammer(closedEyes(art.pal)))}
    </g>
  );
}

/** A closed book lying flat (spine colour, page edge). */
export function ClosedBook({ x, y, color, w = 7 }: { x: number; y: number; color: string; w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={2} fill={color} />
      <rect x={x + 1} y={y} width={w - 2} height={1} fill="#e8dcc0" opacity={0.9} />
    </g>
  );
}

/** A closed book standing or leaning. */
export function StandingBook({ x, y, color, h = 6, lean }: { x: number; y: number; color: string; h?: number; lean?: boolean }) {
  return lean ? (
    <g>
      {Array.from({ length: h }, (_, i) => <rect key={i} x={x + Math.floor(i / 2)} y={y + h - 1 - i} width={2} height={1} fill={color} />)}
    </g>
  ) : (
    <g>
      <rect x={x} y={y} width={2} height={h} fill={color} />
      <rect x={x} y={y + 1} width={2} height={1} fill="#e0b84a" />
    </g>
  );
}

/** An open book: two pages with text lines and a centre fold. */
export function OpenBook({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 1} width={11} height={3} fill="#6b4426" />
      <rect x={x} y={y} width={5} height={3} fill="#f1e6c8" />
      <rect x={x + 6} y={y} width={5} height={3} fill="#f1e6c8" />
      <rect x={x + 5} y={y} width={1} height={3} fill="#c9b283" />
      <rect x={x + 1} y={y + 1} width={3} height={1} fill="#8a7a5a" />
      <rect x={x + 7} y={y + 1} width={3} height={1} fill="#8a7a5a" />
    </g>
  );
}

export function Zzz({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <g className="pr-z"><Grid rows={GLYPH_Z} pal={{ k: "#cfd6ff" }} x={x} y={y} /></g>
      <g className="pr-z pr-z2"><Grid rows={GLYPH_Z} pal={{ k: "#cfd6ff" }} x={x + 4} y={y - 5} /></g>
    </g>
  );
}

export function Bubble({ x, y, kind }: { x: number; y: number; kind: "waiting" | "error" }) {
  const err = kind === "error";
  return (
    <g className={err ? "pr-shake" : "pr-hover"}>
      <rect x={x} y={y} width={9} height={9} fill={INK} />
      <rect x={x + 1} y={y + 1} width={7} height={7} fill={err ? "#d63c3c" : "#ffcf4a"} />
      <rect x={x + 2} y={y + 9} width={2} height={2} fill={INK} />
      {err
        ? <Grid rows={GLYPH_X} pal={{ k: "#ffffff" }} x={x + 2} y={y + 2} />
        : <Grid rows={GLYPH_BANG} pal={{ k: INK }} x={x + 4} y={y + 2} />}
    </g>
  );
}

export function Candle({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <g className="pr-flame">
        <rect x={x + 1} y={y - 4} width={1} height={1} fill="#ffe680" />
        <rect x={x} y={y - 3} width={3} height={2} fill="#ffb02e" />
        <rect x={x + 1} y={y - 2} width={1} height={1} fill="#fff3b0" />
      </g>
      <rect x={x + 1} y={y - 1} width={1} height={1} fill={INK} />
      <rect x={x} y={y} width={3} height={4} fill="#f3ead2" />
      <rect x={x + 2} y={y} width={1} height={4} fill="#d8ccab" />
      <rect x={x - 1} y={y + 4} width={5} height={1} fill="#8b8b8b" />
    </g>
  );
}

/** Soft warm circle of light (drawn after the darkness layer). */
export function Glow({ x, y, r, className }: { x: number; y: number; r: number; className?: string }) {
  return (
    <g className={className} style={{ mixBlendMode: "screen" }}>
      <circle cx={x} cy={y} r={r} fill="#ff9a2e" opacity={0.07} />
      <circle cx={x} cy={y} r={r * 0.66} fill="#ffb347" opacity={0.09} />
      <circle cx={x} cy={y} r={r * 0.36} fill="#ffd27a" opacity={0.12} />
    </g>
  );
}

export function Shelf({ x, y }: { x: number; y: number }) {
  const books = ["#2f6fbd", "#9c2a2a", "#3f8f3a", "#e0b84a", "#6b3e8a", "#2f6fbd", "#9c2a2a"];
  return (
    <g>
      <rect x={x} y={y} width={22} height={22} fill="#4a2f18" />
      {[0, 1, 2].map(row => (
        <g key={row}>
          <rect x={x + 1} y={y + 1 + row * 7} width={20} height={6} fill="#24170f" />
          {books.map((b, i) => (
            <rect key={i} x={x + 2 + i * 3 - (row % 2)} y={y + 2 + row * 7 + (i % 3 === 0 ? 1 : 0)} width={2} height={5 - (i % 3 === 0 ? 1 : 0)} fill={b} />
          ))}
        </g>
      ))}
    </g>
  );
}

export function WallMap({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={22} height={14} fill="#8a6a3a" />
      <rect x={x + 1} y={y + 1} width={20} height={12} fill="#e8d9a8" />
      <rect x={x + 3} y={y + 3} width={6} height={4} fill="#5d9e48" />
      <rect x={x + 12} y={y + 6} width={7} height={5} fill="#5d9e48" />
      <rect x={x + 9} y={y + 2} width={1} height={10} fill="#4a8ad0" />
      <rect x={x + 10} y={y + 9} width={3} height={1} fill="#4a8ad0" />
      <rect x={x + 15} y={y + 3} width={1} height={1} fill="#c0392b" />
      <rect x={x + 16} y={y + 4} width={1} height={1} fill="#c0392b" />
      <rect x={x + 15} y={y + 5} width={1} height={1} fill="#c0392b" />
      <rect x={x + 17} y={y + 3} width={1} height={1} fill="#c0392b" />
      <rect x={x + 17} y={y + 5} width={1} height={1} fill="#c0392b" />
    </g>
  );
}

export function Checklist({ x, y, ticks }: { x: number; y: number; ticks?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={16} height={18} fill="#6b4426" />
      <rect x={x + 1} y={y + 1} width={14} height={16} fill="#f1e6c8" />
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x={x + 3} y={y + 3 + i * 3} width={2} height={2} fill="#9a8a6a" />
          <rect x={x + 6} y={y + 4 + i * 3} width={7 - (i % 2) * 2} height={1} fill="#9a8a6a" />
          {ticks && i < 3 && (
            <g className={clsx("pr-tick", `pr-tick${i}`)}>
              <rect x={x + 3} y={y + 3 + i * 3} width={2} height={2} fill="#3f9c3a" />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

export const ROOM_CSS = `
.pr-svg { image-rendering: pixelated; }

.pr-fa { animation: pr-frame-a .6s steps(1, end) infinite; }
.pr-fb { opacity: 0; animation: pr-frame-b .6s steps(1, end) infinite; }
@keyframes pr-frame-a { 0% { opacity: 1 } 50% { opacity: 0 } }
@keyframes pr-frame-b { 0% { opacity: 0 } 50% { opacity: 1 } }

.pr-flame { animation: pr-flame .7s steps(1, end) infinite; }
@keyframes pr-flame { 0% { transform: translateX(0) } 33% { transform: translateX(-1px) } 66% { transform: translate(0, 1px) } }
.pr-glow { animation: pr-glow 1.8s steps(3, end) infinite; }
.pr-glow-slow { animation: pr-glow 3s steps(3, end) infinite; }
@keyframes pr-glow { 0% { opacity: 1 } 40% { opacity: .78 } 70% { opacity: .92 } 100% { opacity: 1 } }

.pr-z { opacity: 0; animation: pr-z 2.6s steps(6, end) infinite; }
.pr-z2 { animation-delay: 1.3s; }
@keyframes pr-z { 0% { opacity: 0; transform: translate(0, 0) } 20% { opacity: 1 } 100% { opacity: 0; transform: translate(3px, -6px) } }

.pr-breathe { animation: pr-breathe 2.6s steps(1, end) infinite; }
.pr-breathe2 { animation-delay: 1.3s; }
@keyframes pr-breathe { 0% { transform: translateY(0) } 50% { transform: translateY(1px) } }

.pr-quill { animation: pr-quill .9s steps(1, end) infinite; }
@keyframes pr-quill { 0% { transform: translate(0, 0) } 25% { transform: translate(-2px, 1px) } 50% { transform: translate(-4px, 0) } 75% { transform: translate(-2px, 1px) } }

.pr-tick { opacity: 0; animation: pr-tick 3.6s steps(1, end) infinite; }
.pr-tick1 { animation-delay: .9s; }
.pr-tick2 { animation-delay: 1.8s; }
@keyframes pr-tick { 0% { opacity: 0 } 25% { opacity: 1 } 95% { opacity: 1 } }

.pr-hover { animation: pr-hover 1.4s steps(1, end) infinite; }
@keyframes pr-hover { 0% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
.pr-shake { animation: pr-shake .6s steps(1, end) infinite; }
@keyframes pr-shake { 0% { transform: translateX(0) } 25% { transform: translateX(-1px) } 50% { transform: translateX(0) } 75% { transform: translateX(1px) } }

@media (prefers-reduced-motion: reduce) {
  .pr-board *, .pr-board *::before, .pr-board *::after { animation: none !important; }
  .pr-board .pr-fa { opacity: 1; }
  .pr-board .pr-fb { opacity: 0; }
  .pr-board .pr-z { opacity: 1; }
  .pr-board .pr-z2 { opacity: 0; }
  .pr-board .pr-tick { opacity: 1; }
}
`;
