"use client";
// Static scenery of the big pipeline room (Faizuddin, 2026-10-27): stone work
// hall on the left (inbox door, four desks, forge, test bench, findings board,
// done chest), a wood-panelled rest corner on the right behind a railing (tea
// by the window, cooking pot, armchair, bunk beds) so resting never reads as
// working. Coordinates come from bigRoomEngine.ts (room units, 360 x 190).
//
// Three layers: RoomBack (walls, floor, things against the wall: never in
// front of anyone), roomProps() (furniture people walk around, depth-sorted
// with the characters by BigRoom), and RoomPlates (station signs, drawn above
// the darkness so they stay readable).
import type { ReactNode } from "react";
import { Checklist, Fine, ANVIL, ClosedBook, StandingBook, Shelf, WallMap, INK } from "@/components/pipeline/RoomScene";
import {
  AISLE, BENCH, BUNK, BUNK_LEFT, CHEST, DESK_TOP, DESK_W, DESK_X, FURNACE, NOTICE, REST_X, ROOM_H, ROOM_W,
  STATIONS, WALL, type StationId,
} from "@/components/pipeline/bigRoomEngine";

/** x of the railing between the work hall and the rest corner. */
export const RAIL_X = REST_X - 5;
/** How far wall and floor run past the art box, so any page shape is filled. */
const BLEED = 600;
export const FONT = "var(--font-geist-mono), ui-monospace, monospace";

export interface Prop { id: string; depth: number; node: ReactNode }

// ── back layer ──────────────────────────────────────────────────────

function Door() {
  return (
    <g>
      {/* arched oak door in the back wall with a lantern hook */}
      <rect x={3} y={14} width={20} height={WALL - 14} fill="#2a1a10" />
      <rect x={5} y={18} width={16} height={WALL - 18} fill="#6b4426" />
      <rect x={7} y={16} width={12} height={2} fill="#6b4426" />
      {[8, 12, 16].map(x => <rect key={x} x={x} y={18} width={1} height={WALL - 18} fill="#4a2c16" />)}
      <rect x={5} y={26} width={16} height={1} fill="#3a2410" />
      <rect x={5} y={38} width={16} height={1} fill="#3a2410" />
      <rect x={17} y={31} width={2} height={2} fill="#e0b84a" />
      {/* the inbox: a pale slatted crate with letters poking out (2026-10-28: the old
          flat box read as a bench, a dark one as a second chest) */}
      <rect x={6} y={52} width={6} height={5} fill="#f3ead2" />
      <rect x={6} y={52} width={6} height={1} fill="#c9b283" />
      <rect x={8} y={53} width={2} height={1} fill="#b83a3a" />
      <rect x={14} y={53} width={6} height={4} fill="#e8dcc0" />
      <rect x={15} y={54} width={4} height={1} fill="#c9b283" />
      <rect x={4} y={56} width={18} height={2} fill="#3a2410" />
      <rect x={4} y={57} width={18} height={11} fill="#b07a44" />
      <rect x={4} y={57} width={18} height={1} fill="#d39a5a" />
      {[8, 12, 16].map(sx => <rect key={sx} x={sx} y={58} width={1} height={10} fill="#7a4f28" />)}
      <rect x={4} y={62} width={18} height={1} fill="#8a5a33" />
      <rect x={4} y={57} width={1} height={11} fill="#5a3a1e" />
      <rect x={21} y={57} width={1} height={11} fill="#5a3a1e" />
      <rect x={4} y={67} width={18} height={1} fill="#3a2410" />
    </g>
  );
}

function Bookcase({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const colors = ["#2f6fbd", "#9c2a2a", "#3f8f3a", "#e0b84a", "#6b3e8a", "#c86a2a", "#2f6fbd", "#9c2a2a"];
  const rows = Math.floor((h - 2) / 8);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#4a2f18" />
      <rect x={x} y={y} width={w} height={1} fill="#6b4426" />
      {Array.from({ length: rows }, (_, r) => (
        <g key={r}>
          <rect x={x + 1} y={y + 2 + r * 8} width={w - 2} height={7} fill="#1e140c" />
          {Array.from({ length: Math.floor((w - 3) / 2.5) }, (_, i) => {
            const tall = (i + r) % 4 === 0 ? 1 : 0;
            return (
              <rect key={i} x={x + 2 + i * 2.5} y={y + 3 + r * 8 + tall} width={2} height={6 - tall}
                fill={colors[(i * 3 + r * 5) % colors.length]} />
            );
          })}
        </g>
      ))}
    </g>
  );
}

/** Sage's archive: two tall bookcases and a scroll rack against the wall. */
function Archive() {
  const x = DESK_X.sage;
  return (
    <g>
      <Bookcase x={x} y={6} w={19} h={56} />
      <Bookcase x={x + 23} y={6} w={19} h={56} />
      {/* scroll pigeonholes on top */}
      <rect x={x + 6} y={0} width={30} height={6} fill="#3a2410" />
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <rect x={x + 7 + i * 6} y={1} width={5} height={4} fill="#1e140c" />
          <rect x={x + 8 + i * 6} y={2} width={3} height={2} fill="#efe2bf" />
        </g>
      ))}
    </g>
  );
}

function Sconce({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 3} width={3} height={5} fill="#3a2a1c" />
      <rect x={x - 1} y={y + 2} width={5} height={1} fill="#5a4a3a" />
    </g>
  );
}

function Window() {
  return (
    <g>
      <rect x={250} y={6} width={40} height={34} fill="#3a2410" />
      <rect x={252} y={8} width={36} height={30} fill="#0d1838" />
      <rect x={252} y={26} width={36} height={12} fill="#13224a" />
      {/* moon and stars */}
      <circle cx={279} cy={15} r={4} fill="#f3ead2" />
      <circle cx={281} cy={14} r={3.4} fill="#0d1838" />
      {[[256, 12], [264, 18], [270, 10], [286, 24], [259, 24]].map(([sx, sy]) => (
        <rect key={`${sx}-${sy}`} x={sx} y={sy} width={1} height={1} fill="#cfd6ff" />
      ))}
      {/* a shooting star now and then (r6, 2026-10-28; BigRoom BIG_CSS .br-star) */}
      <g className="br-star">
        <rect x={284} y={10} width={2} height={1} fill="#fffaf0" />
        <rect x={286} y={9.5} width={2} height={1} fill="#cfd6ff" opacity={0.5} />
      </g>
      {/* far hills */}
      <rect x={252} y={32} width={36} height={6} fill="#0a1226" />
      <rect x={262} y={30} width={12} height={2} fill="#0a1226" />
      {/* frame bars */}
      <rect x={269} y={8} width={2} height={30} fill="#3a2410" />
      <rect x={252} y={22} width={36} height={2} fill="#3a2410" />
      {/* curtains */}
      <rect x={246} y={4} width={5} height={38} fill="#7a2a2a" />
      <rect x={289} y={4} width={5} height={38} fill="#7a2a2a" />
      <rect x={247} y={4} width={1} height={38} fill="#9c3a3a" />
      <rect x={290} y={4} width={1} height={38} fill="#9c3a3a" />
      <rect x={244} y={3} width={52} height={2} fill="#5a3a1e" />
      {/* sill with a plant */}
      <rect x={250} y={40} width={40} height={2} fill="#6b4426" />
      <rect x={282} y={36} width={4} height={4} fill="#a0522d" />
      <rect x={281} y={32} width={2} height={4} fill="#3f8f3a" />
      <rect x={284} y={31} width={2} height={5} fill="#5d9e48" />
    </g>
  );
}

/** The kitchen hearth with a cooking pot (its fire is drawn by the light layer). */
function Kitchen() {
  return (
    <g>
      <rect x={306} y={30} width={26} height={36} fill="#4c4850" />
      <rect x={304} y={28} width={30} height={3} fill="#6c6670" />
      <rect x={310} y={44} width={18} height={22} fill="#120c0a" />
      <rect x={312} y={64} width={14} height={2} fill="#3a2a1c" />
      {/* pot on a hook */}
      <rect x={318} y={31} width={1} height={14} fill="#2a2a30" />
      <rect x={312} y={46} width={13} height={9} fill="#2a2a30" />
      <rect x={311} y={46} width={15} height={2} fill="#3e3e48" />
      <rect x={313} y={45} width={11} height={1} fill="#7a9a5a" />
      {/* shelf of jars */}
      <rect x={334} y={22} width={22} height={2} fill="#6b4426" />
      {[336, 341, 346, 351].map((x, i) => (
        <rect key={x} x={x} y={17 + (i % 2)} width={3} height={5 - (i % 2)} fill={["#c86a2a", "#3f8f3a", "#e0b84a", "#9c2a2a"][i]} />
      ))}
    </g>
  );
}

export function RoomBack() {
  return (
    <g>
      <defs>
        <pattern id="br-brick" width="16" height="8" patternUnits="userSpaceOnUse">
          <rect width="16" height="8" fill="#4a3e3a" />
          <rect y="3" width="16" height="1" fill="#332a27" />
          <rect y="7" width="16" height="1" fill="#332a27" />
          <rect x="7" width="1" height="3" fill="#332a27" />
          <rect x="15" y="4" width="1" height="3" fill="#332a27" />
          <rect x="1" width="5" height="1" fill="#574a45" />
          <rect x="9" y="4" width="5" height="1" fill="#574a45" />
        </pattern>
        <pattern id="br-panel" width="10" height="46" patternUnits="userSpaceOnUse">
          <rect width="10" height="46" fill="#5e3f26" />
          <rect x="9" width="1" height="46" fill="#46301c" />
          <rect x="1" width="1" height="46" fill="#6e4a2e" />
        </pattern>
        <pattern id="br-floor" width="24" height="6" patternUnits="userSpaceOnUse">
          <rect width="24" height="6" fill="#5e3e26" />
          <rect y="5" width="24" height="1" fill="#46301c" />
          <rect x="11" width="1" height="5" fill="#46301c" />
          <rect x="2" y="1" width="6" height="1" fill="#6e4a2e" />
          <rect x="15" y="3" width="5" height="1" fill="#6e4a2e" />
        </pattern>
        <pattern id="br-flag" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#5a5560" />
          <rect y="11" width="12" height="1" fill="#46424c" />
          <rect x="11" width="1" height="12" fill="#46424c" />
          <rect x="1" y="1" width="4" height="1" fill="#67626d" />
        </pattern>
      </defs>
      {/* walls: stone hall, wood-panelled rest corner */}
      <rect x={-BLEED} y={-BLEED} width={RAIL_X + 2 + BLEED} height={WALL + BLEED} fill="url(#br-brick)" />
      <rect x={RAIL_X + 2} y={-BLEED} width={ROOM_W - RAIL_X + BLEED} height={WALL + BLEED} fill="url(#br-panel)" />
      <rect x={RAIL_X + 2} y={WALL - 8} width={ROOM_W - RAIL_X + BLEED} height={2} fill="#3a2410" />
      {/* ceiling beam and the pillar over the railing */}
      <rect x={-BLEED} y={-6} width={ROOM_W + 2 * BLEED} height={4} fill="#3a2410" />
      <rect x={-BLEED} y={-2} width={ROOM_W + 2 * BLEED} height={1} fill="#24170f" />
      <rect x={RAIL_X - 1} y={-BLEED} width={5} height={WALL + BLEED} fill="#4a2f18" />
      <rect x={RAIL_X - 1} y={-BLEED} width={1} height={WALL + BLEED} fill="#6b4426" />
      <rect x={-BLEED} y={WALL - 2} width={ROOM_W + 2 * BLEED} height={2} fill="#24170f" />
      {/* floors: planks, a flagstone walkway, a rug in the rest corner */}
      <rect x={-BLEED} y={WALL} width={ROOM_W + 2 * BLEED} height={ROOM_H - WALL + BLEED} fill="url(#br-floor)" />
      <rect x={-BLEED} y={AISLE - 7} width={RAIL_X + BLEED} height={13} fill="url(#br-flag)" />
      <rect x={-BLEED} y={AISLE - 7} width={RAIL_X + BLEED} height={1} fill="#3a3640" />
      <rect x={-BLEED} y={AISLE + 6} width={RAIL_X + BLEED} height={1} fill="#3a3640" />
      <rect x={RAIL_X + 2} y={WALL} width={ROOM_W - RAIL_X + BLEED} height={ROOM_H - WALL + BLEED} fill="#8a4a2a" opacity={0.12} />
      <rect x={244} y={72} width={58} height={30} fill="#6a2222" />
      <rect x={246} y={74} width={54} height={26} fill="#8a2e2e" />
      <rect x={249} y={77} width={48} height={20} fill="none" stroke="#c8963a" strokeWidth={1} />
      {/* back-wall furniture of the hall */}
      <Door />
      <WallMap x={DESK_X.scout + 10} y={16} />
      <Shelf x={DESK_X.scribe + 10} y={14} />
      <Checklist x={DESK_X.elf + 13} y={16} />
      <Archive />
      {[DESK_X.scribe - 4, DESK_X.elf - 4, DESK_X.sage - 4].map(x => <Sconce key={x} x={x - 1} y={20} />)}
      {/* rest corner: window, kitchen, reading nook bookcase */}
      <Window />
      <Kitchen />
      <Bookcase x={337} y={30} w={21} h={34} />
    </g>
  );
}

// ── props (depth-sorted with the characters) ─────────────────────────

function Desk({ id, x }: { id: StationId; x: number }) {
  const w = DESK_W;
  const top = DESK_TOP;
  return (
    <g>
      <rect x={x} y={top} width={w} height={5} fill="#8a5a33" />
      <rect x={x} y={top} width={w} height={1} fill="#a8723f" />
      <rect x={x} y={top + 5} width={w} height={11} fill="#5a3a1e" />
      <rect x={x + 2} y={top + 8} width={w - 4} height={1} fill="#46301c" />
      <rect x={x + w / 2 - 2} y={top + 10} width={4} height={1} fill="#c8963a" />
      <rect x={x + 1} y={top + 16} width={3} height={2} fill="#3a2410" />
      <rect x={x + w - 4} y={top + 16} width={3} height={2} fill="#3a2410" />
      {/* the tray finished cards wait on (the Sage passes no cards on: books there instead) */}
      {id !== "sage" && (
        <>
          <rect x={x + 30} y={top - 1} width={12} height={2} fill="#3a2410" />
          <rect x={x + 31} y={top - 1} width={10} height={1} fill="#6b4426" />
        </>
      )}
      {/* a little of each owner's kit at the left end */}
      {id === "scout" && <rect x={x + 6} y={top - 2} width={3} height={2} fill="#c9b283" />}
      {id === "scribe" && (
        <>
          <ClosedBook x={x + 5} y={top - 2} color="#2f6fbd" w={5} />
          <ClosedBook x={x + 5} y={top - 4} color="#9c2a2a" w={5} />
          <rect x={x + 22} y={top - 2} width={2} height={2} fill={INK} />
        </>
      )}
      {id === "elf" && (
        <>
          <rect x={x + 6} y={top - 4} width={2} height={4} fill="#5ab4d6" opacity={0.85} />
          <rect x={x + 6} y={top - 5} width={2} height={1} fill="#c9b283" />
        </>
      )}
      {id === "sage" && (
        <>
          {/* books at the far end, clear of where the Sage stands */}
          <StandingBook x={x + 32} y={top - 6} color="#6b3e8a" />
          <StandingBook x={x + 34} y={top - 6} color="#9c2a2a" />
          <StandingBook x={x + 36} y={top - 6} color="#2f6fbd" lean />
          <rect x={x + 26} y={top - 2} width={4} height={2} fill="#efe2bf" />
          <rect x={x + 26} y={top - 2} width={1} height={2} fill="#c9b283" />
          <rect x={x + 29} y={top - 2} width={1} height={2} fill="#c9b283" />
        </>
      )}
    </g>
  );
}

function Furnace() {
  const { x, y, w } = FURNACE;
  return (
    <g>
      <rect x={x} y={y} width={w} height={42} fill="#3d3a40" />
      {/* r9 (2026-10-28): a stone top seen from above, with a plank on it, so
          the Dwarf's waiting cards rest on something (they read as floating). */}
      <rect x={x - 1} y={y - 4} width={w + 2} height={4} fill="#6e6874" />
      <rect x={x - 1} y={y - 4} width={w + 2} height={1} fill="#4a464e" />
      <rect x={x + 2} y={y - 2.5} width={w - 3} height={2.5} fill="#6b4426" />
      <rect x={x + 2} y={y - 2.5} width={w - 3} height={0.6} fill="#8a5a33" />
      <rect x={x - 1} y={y} width={w + 2} height={3} fill="#5a5560" />
      {[y + 8, y + 16, y + 24, y + 32].map(r => <rect key={r} x={x} y={r} width={w} height={1} fill="#2c2a30" />)}
      <rect x={x + 3} y={y + 18} width={w - 6} height={12} fill="#120c0a" />
      <rect x={x + 2} y={y + 17} width={w - 4} height={1} fill="#5a5560" />
      {/* tongs and a coal bucket */}
      <rect x={x + w} y={y + 30} width={4} height={6} fill="#2a2a30" />
      <rect x={x + w} y={y + 30} width={4} height={1} fill="#1a1a1e" />
    </g>
  );
}

function Bench() {
  const { x, w, top } = BENCH;
  return (
    <g>
      <rect x={x} y={top} width={w} height={4} fill="#7a5030" />
      <rect x={x} y={top} width={w} height={1} fill="#9a6a3e" />
      <rect x={x} y={top + 4} width={w} height={10} fill="#4a2f18" />
      <rect x={x + 1} y={top + 14} width={3} height={2} fill="#3a2410" />
      <rect x={x + w - 4} y={top + 14} width={3} height={2} fill="#3a2410" />
      {/* flasks and a rack of test tubes */}
      <rect x={x + 2} y={top - 5} width={4} height={5} fill="#3fb86a" opacity={0.85} />
      <rect x={x + 3} y={top - 7} width={2} height={2} fill="#c9d6e0" />
      <rect x={x + 22} y={top - 1} width={6} height={1} fill="#6b4426" />
      {[0, 2, 4].map(i => <rect key={i} x={x + 22.5 + i} y={top - 4} width={1} height={3} fill={["#e05252", "#5ab4d6", "#e0b84a"][i / 2]} />)}
      <rect x={x + 29} y={top - 1} width={11} height={2} fill="#3a2410" />
    </g>
  );
}

function NoticeBoard() {
  const { x, w, top, bottom } = NOTICE;
  return (
    <g>
      <rect x={x + 2} y={bottom} width={2} height={12} fill="#3a2410" />
      <rect x={x + w - 4} y={bottom} width={2} height={12} fill="#3a2410" />
      <rect x={x} y={top} width={w} height={bottom - top} fill="#4a2f18" />
      <rect x={x + 2} y={top + 2} width={w - 4} height={bottom - top - 5} fill="#a8784a" />
      {[[x + 5, top + 12], [x + 30, top + 4], [x + 18, top + 13]].map(([px, py]) => (
        <rect key={`${px}-${py}`} x={px} y={py} width={5} height={4} fill="#e8dcc0" opacity={0.7} />
      ))}
      <rect x={x} y={bottom - 3} width={w} height={2} fill="#6b4426" />
    </g>
  );
}

function Chest() {
  const { x, w, top } = CHEST;
  return (
    <g>
      <rect x={x} y={top} width={w} height={5} fill="#7a4a24" />
      <rect x={x} y={top} width={w} height={1} fill="#9a6232" />
      <rect x={x} y={top + 5} width={w} height={9} fill="#5a3418" />
      <rect x={x} y={top + 4} width={w} height={1} fill="#c8963a" />
      <rect x={x + 4} y={top} width={2} height={14} fill="#c8963a" />
      <rect x={x + w - 6} y={top} width={2} height={14} fill="#c8963a" />
      <rect x={x + w / 2 - 2} y={top + 5} width={4} height={4} fill="#e0b84a" />
      <rect x={x + w / 2 - 1} y={top + 7} width={2} height={1} fill={INK} />
    </g>
  );
}

function Bunk({ x, quilt }: { x: number; quilt: string }) {
  const { w, top, bottom, upper, lower } = BUNK;
  const bed = (y: number) => (
    <g>
      {/* headboard, mattress, pillow, a quilt folded at the foot, side board */}
      <rect x={x + 2} y={y - 10} width={w - 4} height={10} fill="#3a2410" opacity={0.55} />
      <rect x={x + 2} y={y - 1} width={w - 4} height={3} fill="#d8ccab" />
      <rect x={x + 2} y={y - 3} width={6} height={3} fill="#f3ead2" />
      <rect x={x + w - 9} y={y - 2} width={6} height={3} fill={quilt} />
      <rect x={x + 1} y={y + 2} width={w - 2} height={4} fill="#7a4a24" />
      <rect x={x + 1} y={y + 2} width={w - 2} height={1} fill="#9a6232" />
    </g>
  );
  return (
    <g>
      <rect x={x} y={top} width={3} height={bottom - top} fill="#6b4426" />
      <rect x={x + w - 3} y={top} width={3} height={bottom - top} fill="#6b4426" />
      <rect x={x} y={top} width={1} height={bottom - top} fill="#8a5a33" />
      <rect x={x + w - 3} y={top} width={1} height={bottom - top} fill="#8a5a33" />
      <rect x={x} y={top} width={w} height={3} fill="#8a5a33" />
      {bed(upper)}
      {bed(lower)}
      {/* ladder */}
      <rect x={x + w - 7} y={upper + 6} width={1} height={lower - upper - 6} fill="#4a2f18" />
      <rect x={x + w - 4} y={upper + 6} width={1} height={lower - upper - 6} fill="#4a2f18" />
      {[upper + 9, upper + 14, upper + 19].map(y => <rect key={y} x={x + w - 7} y={y} width={4} height={1} fill="#8a5a33" />)}
    </g>
  );
}

/** The stool the night candle stands on (the candle is drawn by the light layer). */
function Stool() {
  return (
    <g>
      <rect x={340} y={155} width={11} height={3} fill="#8a5a33" />
      <rect x={341} y={158} width={2} height={10} fill="#5a3a1e" />
      <rect x={348} y={158} width={2} height={10} fill="#5a3a1e" />
    </g>
  );
}

function TeaTable() {
  return (
    <g>
      <rect x={267} y={84} width={4} height={8} fill="#4a2f18" />
      <rect x={263} y={91} width={12} height={2} fill="#3a2410" />
      <rect x={261} y={80} width={16} height={4} fill="#8a5a33" />
      <rect x={261} y={80} width={16} height={1} fill="#a8723f" />
      {/* teapot and two cups */}
      <rect x={266} y={76} width={6} height={4} fill="#3a6fb8" />
      <rect x={267} y={75} width={4} height={1} fill="#5a8ad0" />
      <rect x={272} y={77} width={2} height={1} fill="#3a6fb8" />
      <rect x={262} y={78} width={2} height={2} fill="#f3ead2" />
      <rect x={275} y={78} width={2} height={2} fill="#f3ead2" />
    </g>
  );
}

function ArmchairBack() {
  return (
    <g>
      <rect x={338} y={84} width={18} height={14} fill="#6a2222" />
      <rect x={339} y={85} width={16} height={11} fill="#8a2e2e" />
      <rect x={338} y={84} width={18} height={1} fill="#a83a3a" />
    </g>
  );
}

function ArmchairFront() {
  return (
    <g>
      <rect x={338} y={96} width={18} height={6} fill="#7a2a2a" />
      <rect x={336} y={91} width={4} height={12} fill="#6a2222" />
      <rect x={354} y={91} width={4} height={12} fill="#6a2222" />
      <rect x={336} y={91} width={4} height={1} fill="#a83a3a" />
      <rect x={354} y={91} width={4} height={1} fill="#a83a3a" />
      <rect x={338} y={103} width={2} height={2} fill="#3a2410" />
      <rect x={354} y={103} width={2} height={2} fill="#3a2410" />
    </g>
  );
}

/** A cat asleep by the kitchen hearth: breathes, flicks its tail now and then (r6, 2026-10-28). */
function Cat() {
  // Clear of the reading lamp (330 to 337).
  const x = 340;
  const y = 64;
  const fur = "#c8783a";
  return (
    <g>
      <rect x={x} y={y + 5} width={12} height={1} fill="#000" opacity={0.25} />
      <g className="br-cat">
        <rect x={x + 1} y={y + 2} width={8} height={3} fill={fur} />
        <rect x={x + 2} y={y + 1} width={6} height={1} fill={fur} />
        <rect x={x + 2} y={y + 1} width={4} height={1} fill="#e09a5a" />
        <rect x={x + 7} y={y + 1} width={4} height={4} fill={fur} />
        <rect x={x + 7} y={y} width={1} height={1} fill={fur} />
        <rect x={x + 10} y={y} width={1} height={1} fill={fur} />
        <rect x={x + 8} y={y + 2.5} width={1} height={0.5} fill="#3a2410" />
        <rect x={x + 10} y={y + 3.5} width={1} height={0.5} fill="#d88a8a" />
      </g>
      <g className="br-tail-a"><rect x={x - 2} y={y + 4} width={3} height={1} fill={fur} /></g>
      <g className="br-tail-b"><rect x={x - 1} y={y + 2} width={1} height={2} fill={fur} /><rect x={x - 2} y={y + 1} width={1} height={1} fill={fur} /></g>
    </g>
  );
}

/** Two anvils for the Dwarf's two spots, just right of where each stands. */
export const ANVIL_X = [STATIONS.forge.spots[0].x + 5, STATIONS.forge.spots[1].x + 5];
const ANVIL_TOP = 138;

/** Furniture that people walk in front of and behind, with its sort depth (front edge y). */
export function roomProps(): Prop[] {
  const out: Prop[] = [];
  for (const id of ["scout", "scribe", "elf", "sage"] as const) {
    out.push({ id: `desk-${id}`, depth: DESK_TOP + 18, node: <Desk id={id} x={DESK_X[id]} /> });
  }
  out.push({ id: "furnace", depth: FURNACE.y + 42, node: <Furnace /> });
  ANVIL_X.forEach((x, i) => out.push({ id: `anvil-${i}`, depth: ANVIL_TOP + 9, node: <Fine rows={ANVIL.rows} pal={ANVIL.pal} x={x} y={ANVIL_TOP} /> }));
  out.push({ id: "bench", depth: BENCH.top + 16, node: <Bench /> });
  out.push({ id: "notice", depth: NOTICE.bottom + 11, node: <NoticeBoard /> });
  out.push({ id: "chest", depth: CHEST.top + 14, node: <Chest /> });
  BUNK_LEFT.forEach((x, i) => out.push({ id: `bunk-${i}`, depth: BUNK.bottom, node: <Bunk x={x} quilt={["#2c662d", "#5a3478", "#26348a"][i]} /> }));
  out.push({ id: "stool", depth: 168, node: <Stool /> });
  out.push({ id: "tea", depth: 92, node: <TeaTable /> });
  out.push({ id: "cat", depth: 69, node: <Cat /> });
  out.push({ id: "chair-back", depth: 98, node: <ArmchairBack /> });
  out.push({ id: "chair-front", depth: 101, node: <ArmchairFront /> });
  out.push({ id: "rail", depth: ROOM_H + 50, node: <Railing /> });
  return out;
}

/** Low railing between hall and rest corner, open at the walkway. */
function Railing() {
  const seg = (y1: number, y2: number) => (
    <g>
      <rect x={RAIL_X} y={y1 - 6} width={3} height={y2 - y1} fill="#6b4426" />
      <rect x={RAIL_X} y={y1 - 6} width={1} height={y2 - y1} fill="#8a5a33" />
      {Array.from({ length: Math.floor((y2 - y1) / 10) + 1 }, (_, i) => (
        <rect key={i} x={RAIL_X} y={y1 + i * 10 - 6} width={3} height={7} fill="#4a2f18" />
      ))}
    </g>
  );
  return (
    <g>
      {seg(WALL + 6, AISLE - 9)}
      {seg(AISLE + 14, ROOM_H + 40)}
    </g>
  );
}

// ── plates (above the darkness) ──────────────────────────────────────

const PLATE_W: Partial<Record<StationId, number>> = { door: 22 };

export function RoomPlates() {
  return (
    <g style={{ pointerEvents: "none" }}>
      {(Object.keys(STATIONS) as StationId[]).map(id => {
        const s = STATIONS[id];
        const w = PLATE_W[id] ?? Math.max(28, s.label.length * 2.05 + 4);
        const y = id === "door" ? 9 : s.plate.y - 3.5;
        const x = s.plate.x;
        return (
          <g key={id}>
            <rect x={x - w / 2} y={y} width={w} height={6} fill="#24170f" opacity={0.92} />
            <rect x={x - w / 2} y={y} width={w} height={1} fill="#6b4426" />
            <text x={x} y={y + 4.6} textAnchor="middle" fontSize={3.4} fill="#e8d9a8" fontFamily={FONT}>{s.label}</text>
          </g>
        );
      })}
      <g>
        <rect x={RAIL_X - 6} y={12} width={15} height={7} fill="#24170f" />
        <rect x={RAIL_X - 6} y={12} width={15} height={1} fill="#8a5a33" />
        <text x={RAIL_X + 1.5} y={17.2} textAnchor="middle" fontSize={3.6} fill="#ffdcaa" fontFamily={FONT}>Rest</text>
      </g>
    </g>
  );
}

