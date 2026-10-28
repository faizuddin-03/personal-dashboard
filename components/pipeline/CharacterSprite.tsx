"use client";
// Pixel avatars for the four pipeline characters (Faizuddin, 2026-10-27).
// Same text-grid approach as app/agents/page.tsx: one char = one art pixel,
// "." is empty, drawn as SVG rects. 24 x 32 art pixels each (redrawn at twice
// the old 12 x 16 for more detail, 2026-10-27); they still fill the same
// on-screen box, so each art pixel is half the old size.
// Looks per Faizuddin (2026-10-27): Scout a green ranger in a pointed hood with
// a bow on his back; Scribe in a purple robe with brown hair, a quill and a
// book; Elf with long blonde hair, pointed ears and a white dress; Dwarf with a
// red beard, horned steel helmet and his war hammer.
// Palette keys every room scene relies on: "e" = eye pixels, "i" = eye
// highlight (both swapped by closedEyes), HAMMER_KEYS = the Dwarf's hammer.
// Outlines are coloured per material (lighter on the lit top/left edges).
import type { ReactNode } from "react";
import clsx from "clsx";
import type { Character } from "@/lib/pipeline/types";

type Palette = Record<string, string>;
type Art = { rows: string[]; pal: Palette };

/** Art pixels per sprite; the old 12 x 16 room/avatar box maps to this. */
export const ART_W = 24;
export const ART_H = 32;

/** Palette keys of the Dwarf's war hammer (head, highlight, shadow, handle, grip, outlines). */
export const HAMMER_KEYS = ["H", "I", "J", "h", "f", "K", "L"];

const SCOUT = {
  rows: [
    "...............222......",
    "..........22222LgG06....",
    "........22LLgggggG0q0...",
    ".......2LLgggggggGGqw0..",
    "......2LgggggggggGGq0w0.",
    ".....2LgLgggggggggG06w0.",
    "....2LggLgggggggggG06w0.",
    "....2LggDDDDDDDDDGGG00w0",
    "....2LgDDhjhhjhhDDGG06w0",
    "....2LgDhjhhjhhjhDGG06w0",
    "....2LgDhzhshhzshDGG06w0",
    "....2LgDzbbsssbbSDGG06W0",
    "....2LgDziesssieSDGG06W0",
    "....2LgDseessseeSDGG06W0",
    "....2LgDzsssSsssSDGG06W0",
    "....2LgDDssmmsSSDDGG06W0",
    "...2LgggDDSsssSDDGGG06W0",
    "..2LggggggDDyDDgggGGGW0.",
    "..2LgGggLuutxttTGgGgGW0.",
    "..2LgGggLutttttTGgGgGW0.",
    "..2LgGgvCuttxttTvCgGG0..",
    "..2LgGgzsBBByBBBsSgGG0..",
    "..2LgGgsSuttttcCSSgGG0..",
    "..2LgGgGGutttTTTGGgGG0..",
    "..2LgGgGGutTtTTTGgGgG0..",
    "..2GgGG0ppPP0pPPP0gGG0..",
    "...0G007ppPP0pPPP00G0...",
    "....0.7vvvvC0vvvvC00....",
    "......70vccC0vccC07.....",
    ".....7vvcccC0vccccC0....",
    ".....7CCCCCC0CCCCCC0....",
    "......000000.000000.....",
  ],
  pal: {
    "0": "#15121c", "2": "#1d4a1f", "6": "#4a2c12", "7": "#2a180c", z: "#ffe3c4", s: "#f4c79c", S: "#d6966a",
    e: "#1b1b24", i: "#ffffff", m: "#a8504a", L: "#82c866", g: "#3f8f3a", G: "#2c662d", D: "#163818",
    h: "#6b4423", j: "#94663a", b: "#4a2d16", u: "#c28a52", t: "#9a6436", T: "#6e4424", x: "#e8d8b0",
    B: "#3b2a1a", y: "#f0c85a", p: "#6a5a44", P: "#4a3f30", v: "#9a6a3e", c: "#6b4426", C: "#45291a",
    w: "#c88e4c", W: "#8a5626", q: "#efe6cc",
  },
};

const SCRIBE = {
  rows: [
    "..........44444.........",
    "........44jjhhH04.......",
    ".......4jjhhjhhhH0......",
    "......4jhhjhhhjhHH0.....",
    ".....4hjhhjhhhjhhHH0....",
    ".....4hhhjhhhhjhhHH0....",
    ".....4hhhzhhsshzhHH0....",
    ".....4hHzbbsssbbSHH0....",
    ".....4HhziesssieShH0....",
    ".....4HsseessseeSSH0.6..",
    "......0HzsssSsssSH0.6Q0.",
    ".......0SssmmsSSS0.6qQ0.",
    "......990SssssSS096qqQ0.",
    ".....9VZcySssSyCCV0qq0..",
    "....9VZccyySSyyCCCVqQ0..",
    "...9ZccVZccyYcCCVcqQ0...",
    "..11ZccVZccyYcCCVcQV0...",
    ".1xxxxpVZccyYccCVykV0...",
    ".1xyxxpVZcZyYcCCVsSV0...",
    ".1xxxxpVrrRrrRrRCCCV0...",
    ".1XXXsSVZcryYcCCCcCV0...",
    "..00ZcZVcrcyYccCCCCV0...",
    "....0ZcZcRcyYcccCCCV0...",
    "...9ZcZccccyYccccCCCV0..",
    "...9ZcZcVccyYccVcCCCV0..",
    "..9ZZcZcVccyYcccVcCCV0..",
    "..9ZcZccVccyYccVccCCV0..",
    "..9ZcZccVccyYccVccCCV0..",
    "..9yyyyyyyyYYyyyyyYYY0..",
    "...000bbbB000bbbB0000...",
    "....7BBBBB0.7BBBBB0.....",
    ".....00000...00000......",
  ],
  pal: {
    "0": "#15121c", "1": "#16284a", "4": "#3a2210", "6": "#55556a", "7": "#2a180c", "9": "#2a1438",
    z: "#ffe3c4", s: "#f4c79c", S: "#d6966a", e: "#1b1b24", i: "#ffffff", m: "#a8504a", j: "#a7743f",
    h: "#6b4423", H: "#4a2c16", b: "#5a3a1e", B: "#3a2414", Z: "#b385da", c: "#7f4fa6", C: "#5a3478",
    V: "#3c2052", y: "#e8c25a", Y: "#b08a2a", r: "#d8c08a", R: "#a08850", q: "#f8f8f8", Q: "#c3c3d2",
    k: "#1b1b24", x: "#3a6fb8", X: "#24487a", p: "#f1e6c8",
  },
};

const ELF = {
  rows: [
    ".........444444.........",
    ".......44AAHHHy044......",
    "......4AAHHHHHHHyy0.....",
    ".....4AHHHAHHHHHHyy0....",
    "....4AHHHHHAHHHHHyyY0...",
    "....4AHHHgggngggHyyY0...",
    "...34AHHHzsssssSHyyY0...",
    "..3z0AHHzkksssskSHyYS0..",
    "..3zsAHHziesssieSHysS0..",
    "...0zsHyseessseeSysS0...",
    "....0sSyzsssSsssSsSY0...",
    "....4AHHHssmmsSSHyyY0...",
    "....4AHyHHSsssSHHyyY0...",
    "...4AHHyHHHSsSHyHyYY0...",
    "..4AHyHHWwgggggvVHyHY0..",
    "..4AHyHyWwwwnwwvVHyyY0..",
    "..4AHyHyWWwwwwvvVyHyY0..",
    "..4AyHyYWwWwwwwvVyHYY0..",
    "..4AyHyYGgggngggGyyY0...",
    "..4AyHYWWwwvwwwvvVHyY0..",
    "..4AyYsWWwwvwwwwvVSyY0..",
    "...0YYSWWwwvwwwwvvVY0...",
    "....0WWWwwvwwwwvwvVV0...",
    "....9WWwwwvwwwwvwvvV0...",
    "...9WWwwwwvwwwwvwvvVV0..",
    "...9WWwwwwvwwwwvwvvVV0..",
    "...9WwwwwvwwwwwvwwvVV0..",
    "...9ggggggggggggGGGGG0..",
    "....0000bbbB0bbbB0000...",
    "......7bbbbB0bbbbB0.....",
    "......7BBBBB0BBBBB0.....",
    ".......00000.00000......",
  ],
  pal: {
    "0": "#1c1626", "3": "#8a5236", "4": "#7a5212", "7": "#2a180c", "9": "#5a5472", z: "#ffe3c4",
    s: "#f4c79c", S: "#d6966a", e: "#2e7d3e", i: "#ffffff", m: "#a8504a", k: "#b88a3e", A: "#fff2b8",
    H: "#f2cf66", y: "#cf9e32", Y: "#9a6e1c", W: "#ffffff", w: "#ecebf3", v: "#c9c4d8", V: "#9a93b2",
    g: "#e8c25a", G: "#b08a2a", n: "#3fb86a", b: "#9a6a3e", B: "#5a3a1a",
  },
};

const DWARF = {
  rows: [
    "........................",
    "..6................6....",
    ".6o0..............6Q0...",
    ".6oO0..11111111..6OQ0...",
    ".6oOO01MMmmmmnn06OOQ0...",
    "..0oOOMMmmmmmmnNOOQ0....",
    "...0OOMmMmmmmmnNQQ0.KK..",
    "...1NMmmmmmmmmmnnN0KIJK.",
    "...1nMnnMnnMnnMnnN0IIHJK",
    "....0NSbbbnnbbbSN0KIHHJK",
    "....3SsieSnnSieSS0KJJJJK",
    "....2SseeSnnSeeSS0KIHHJK",
    "...2arrSsszzsSSrRd0IHHJK",
    "..5arrraarSSRaarrRd0hfL.",
    ".5uarrraaaRRaaarrRd0hfL.",
    ".5utarraaRkkRaarRdTThfL.",
    ".5utarrarrRrrRrRRdTThfL.",
    ".5utarrarrRrrRrRRBBBhfL.",
    ".5utarrarrRrrRrRRdzsSfL.",
    ".5BBBarrarRrrRRRdtsSSfL.",
    ".3zsSuarrarRrRRdTT00ffL.",
    ".3sSSuttarRRRdttTT0LhfL.",
    "..00BBBBByyyYBBBBBB0ffL.",
    "...5BBBBBYYYYBBBBBB0hfL.",
    "...5utttTtttttTtttT0hfL.",
    "...5uttTttttttTttT0LhfL.",
    "....0ppppP00pppPP0.KIJK.",
    "...7vvcccC07vvcccC0.KK..",
    "...7vccccC07vccccC0.....",
    "..7vvccccC07vvccccC0....",
    "..7CCCCCCC07CCCCCCC0....",
    "...0000000..0000000.....",
  ],
  pal: {
    "0": "#15121c", "1": "#2a3038", "2": "#4a120c", "3": "#8a5236", "5": "#3e2412", "6": "#5a4a2a",
    "7": "#2a180c", z: "#ffe3c4", s: "#f4c79c", S: "#d6966a", e: "#1b1b24", i: "#ffffff", m: "#a6b0bb",
    M: "#e4e9ef", n: "#6f7a87", N: "#4a525e", o: "#f6eed6", O: "#d9c9a0", Q: "#a8956a", a: "#f2804e",
    r: "#c8402c", R: "#8e2a1f", d: "#5e1a14", b: "#9e3220", k: "#4a1410", u: "#c28a52", t: "#9a6436",
    T: "#6e4424", B: "#3b2a1a", y: "#f0c85a", Y: "#b08a2a", p: "#5a4a3a", P: "#3e3228", v: "#8a5c34",
    c: "#5a3a1a", C: "#3b2614", H: "#a6b0bb", I: "#e4e9ef", J: "#5f6976", h: "#8a5a2e", f: "#5a3a1a",
    K: "#2a3038", L: "#3a2410",
  },
};

// Sage (Faizuddin, 2026-10-27): the knowledge keeper, an old wizard-librarian:
// pointed blue hat and robe with silver stars, long white beard, small round
// spectacles, a big red book held at his side.
const SAGE = {
  rows: [
    "...........00...........",
    "..........0LB0..........",
    "..........0LBb0.........",
    ".........0LBxb0.........",
    ".........0LBBb0.........",
    "........0LBBBBb0........",
    "........0LxBBBb0........",
    ".......0LBBBBxBb0.......",
    ".......0LBBBBBBb0.......",
    "......0LBBxBBBBBb0......",
    "....0yyyyyyyyyyyyyY0....",
    "...0bbbbbbbbbbbbbbbbb0..",
    "......0WzssssssSW0......",
    "......0WoeoooeoSW0......",
    "......0WsssSSssSW0......",
    "......0WwwwwwwwwW0......",
    ".....0WwwwwwwwwwwW0.....",
    "....0RrWwwwwwwwwWrR0....",
    "...0RrrRgwwwwwwgRrR0....",
    "..0RrxrRgwwwwwwgRxR0KK..",
    "..0RrrrRRgwwwwgRRrKkkkK.",
    "..0RrrRzsgwwwwgRrRKpkkkK",
    "..0RrrRssRgwwgRzsKppkxkK",
    "..0RrxRSsRRgwgRssKppkkkK",
    "..0RrrrRRRRgWRRRRKppkkkK",
    "..0RrrrRxRRRgRRRRDKKKKK.",
    "..0RrrrRRRRRRRRxRRD0....",
    "..0RrxrRRRRRRRRRRRD0....",
    ".0RrrrrRRRxRRRRRRRRD0...",
    ".0RrrrrRRRRRRRRRxRRD0...",
    ".0yyyyyyyyyyyyyyyyyyY0..",
    "..00cccC00000cccC000....",
  ],
  pal: {
    "0": "#15121c", L: "#5a70d6", B: "#2e3f9e", b: "#1a245e", x: "#e6ecff", y: "#e8c25a", Y: "#b08a2a",
    W: "#b9bfca", w: "#eef1f6", g: "#a9b0bc", o: "#cfd6de", z: "#ffe3c4", s: "#f4c79c", S: "#d6966a",
    e: "#1b1b24", i: "#ffffff", R: "#26348a", r: "#3d50b8", D: "#151c50", K: "#4e1818", k: "#8a2e2e",
    p: "#f1e6c8", c: "#5a3a1a", C: "#3b2614",
  },
};

export const CHARACTER_INFO: Record<Character, { name: string; role: string; art: Art }> = {
  scout: { name: "Scout", role: "Studies Jira tickets and drafts QA-Issues", art: SCOUT },
  scribe: { name: "Scribe", role: "Reads past test scripts of related tickets", art: SCRIBE },
  elf: { name: "Elf", role: "Writes the test scenarios and keeps the TS status", art: ELF },
  dwarf: { name: "Dwarf", role: "Builds the automation after your green light", art: DWARF },
  sage: { name: "Sage", role: "Keeps the knowledge base and flows up to date from what the pipeline learns", art: SAGE },
};

/**
 * Back view (r7, 2026-10-28: the window gazer stood sideways because sprites
 * had no back). Regions of the front art are painted over: the face with the
 * hair, hood or hat colour and, since r8, the front-only body details too
 * (Scout's tunic under the cloak, Scribe's gold trim, the Elf's sash under her
 * hair, the Dwarf's nose and beard shape as plain hair, Sage's beard as robe).
 * Region = [first row, last row, keys to hide, fill key, first col, last col]
 * (front-art columns; the result is then mirrored).
 */
type BackRegion = [number, number, string, string, number, number];
const BACK: Record<Character, BackRegion[]> = {
  scout: [[7, 16, "DhjzsSeimbS", "g", 7, 17], [17, 24, "DyutTxBvCzsSc", "g", 8, 16]],
  scribe: [[6, 15, "zsSeimbj", "h", 6, 17], [12, 13, "sSy", "h", 7, 16], [13, 27, "yY", "c", 8, 14]],
  elf: [[5, 13, "gnzsSeimk", "H", 6, 17], [13, 18, "WwgnvVGsS", "H", 8, 16]],
  dwarf: [[9, 12, "zsSeibn", "r", 5, 17], [12, 21, "zsSakb", "r", 5, 16]],
  sage: [[12, 14, "zsSoei", "w", 8, 16], [17, 25, "wWg", "R", 7, 16]],
};
const backCache = new Map<Character, Art>();
export function backView(c: Character): Art {
  const hit = backCache.get(c);
  if (hit) return hit;
  const art = CHARACTER_INFO[c].art;
  const rows = art.rows.map((row, y) => {
    const cells = [...row];
    for (const [r0, r1, keys, fill, c0, c1] of BACK[c]) {
      if (y < r0 || y > r1) continue;
      for (let x = c0; x <= c1; x++) if (keys.includes(cells[x])) cells[x] = fill;
    }
    // r9 (2026-10-28): seen from behind, what is held in one hand shows on the
    // other side (Scribe's book, the Dwarf's hammer, Sage's book), so the back is mirrored.
    return cells.reverse().join("");
  });
  const out = { rows, pal: art.pal };
  backCache.set(c, out);
  return out;
}

/** The palette with the eyes shut: pupils become a lash line, highlights become skin. */
export function closedEyes(pal: Palette): Palette {
  return { ...pal, e: "#7a4632", i: pal.S ?? pal.s ?? "#d6966a" };
}

/**
 * One rect per same-colour run. `bleed` widens each rect slightly so smooth
 * (anti-aliased) rendering at small sizes shows no hairline seams.
 */
export function rectsFor(rows: string[], pal: Palette, bleed = 0): ReactNode[] {
  const out: ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || !pal[ch]) { x++; continue; }
      let w = 1;
      while (row[x + w] === ch) w++;
      out.push(<rect key={`${x}-${y}`} x={x} y={y} width={w + bleed} height={1 + bleed} fill={pal[ch]} />);
      x += w;
    }
  });
  return out;
}

/** One character's pixel avatar. `busy` adds a small pulsing dot. */
export default function CharacterSprite({ character, size = 32, busy, waiting, className }: {
  character: Character; size?: number; busy?: boolean; waiting?: boolean; className?: string;
}) {
  const info = CHARACTER_INFO[character];
  const rows = info.art.rows;
  const w = rows[0]?.length ?? ART_W;
  const h = rows.length;
  return (
    <span className={clsx("relative inline-block shrink-0", className)} style={{ width: size * 0.75, height: size }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={size * 0.75}
        height={size}
        shapeRendering="geometricPrecision"
        role="img"
        aria-label={info.name}
        className="block"
      >
        {rectsFor(rows, info.art.pal, 0.06)}
      </svg>
      {(busy || waiting) && (
        <span
          className={clsx(
            "absolute -top-0.5 -right-1 w-2 h-2 rounded-full border border-slate-900",
            waiting ? "bg-amber-400" : "bg-blue-400 animate-pulse",
          )}
          aria-hidden
        />
      )}
    </span>
  );
}
