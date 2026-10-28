"use client";
// Agents page (Faizuddin, 2026-10-27): a pixel-art view of the two scheduled
// study agents (scripts/agents/run-agent.mjs, started by Windows Task
// Scheduler). Each agent is a pixel character in its own room of a guild
// hall; its pose follows AgentStatus.state. Data comes from
// /api/agents/status, polled every 4 s while the tab is visible.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Bot, Play, Copy, Check, RefreshCw, Link2, Unlink, FolderSync, AlertTriangle, StickyNote } from "lucide-react";
import clsx from "clsx";
import {
  AGENT_META,
  type AgentId, type AgentRunRecord, type AgentState, type AgentStatus,
} from "@/lib/agentStatus";
import { getStoredCredentials } from "@/lib/jira";

interface SetupInfo { jira: boolean; sharepointDir: string | null; checkedAt: string | null }
interface StatusResponse { agents: AgentStatus[]; runs: AgentRunRecord[]; setup: SetupInfo }

const POLL_MS = 4000;
const BUSY: AgentState[] = ["waking", "searching", "reading", "writing"];

const STATE_LABEL: Record<AgentState, string> = {
  sleeping: "Resting",
  "off-hours": "Off hours",
  waking: "Starting",
  searching: "Looking for work",
  reading: "Reading",
  writing: "Writing",
  done: "Finished",
  "needs-setup": "Needs setup",
  error: "Error",
};

const STATE_TONE: Record<AgentState, string> = {
  sleeping: "bg-slate-800 text-slate-300 border-slate-700",
  "off-hours": "bg-slate-800 text-slate-400 border-slate-700",
  waking: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  searching: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  reading: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  writing: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  done: "bg-green-500/15 text-green-300 border-green-500/30",
  "needs-setup": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  error: "bg-red-500/15 text-red-300 border-red-500/30",
};

// ── Time helpers (Malaysia time) ─────────────────────────────
const TZ = "Asia/Kuala_Lumpur";
const fmtDateTime = new Intl.DateTimeFormat("en-MY", {
  timeZone: TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
});
const fmtTime = new Intl.DateTimeFormat("en-MY", {
  timeZone: TZ, hour: "numeric", minute: "2-digit", second: "2-digit",
});

function when(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : fmtDateTime.format(d);
}
function clock(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : fmtTime.format(d);
}
function duration(fromIso: string | null | undefined, toIso: string | null | undefined): string {
  if (!fromIso || !toIso) return "—";
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (!isFinite(ms) || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function relative(iso: string | null | undefined, now: number): string {
  if (!iso || !now) return "";
  const ms = new Date(iso).getTime() - now;
  if (!isFinite(ms)) return "";
  const min = Math.round(Math.abs(ms) / 60000);
  const txt = min < 1 ? "less than a minute" : min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
  return ms >= 0 ? `in ${txt}` : `${txt} ago`;
}

// ══════════════════════════════════════════════════════════════
// Pixel art
// ══════════════════════════════════════════════════════════════

type Palette = Record<string, string>;

/** Draws a sprite from text rows: each char is one art pixel, "." is empty. */
function Sprite({ rows, pal, x = 0, y = 0, className }: {
  rows: string[]; pal: Palette; x?: number; y?: number; className?: string;
}) {
  const rects: ReactNode[] = [];
  rows.forEach((row, ry) => {
    let rx = 0;
    while (rx < row.length) {
      const ch = row[rx];
      if (ch === "." || !pal[ch]) { rx++; continue; }
      let w = 1;
      while (row[rx + w] === ch) w++;
      rects.push(<rect key={`${rx}-${ry}`} x={x + rx} y={y + ry} width={w} height={1} fill={pal[ch]} />);
      rx += w;
    }
  });
  return <g className={className}>{rects}</g>;
}

const withRows = (base: string[], patch: Record<number, string>) => base.map((r, i) => patch[i] ?? r);

// Character, 16 x 24 art pixels, front view.
const STAND: string[] = [
  "................",
  ".....kkkkkk.....",
  "....khhhhhhk....",
  "....khhhhhhk....",
  "....khsssshk....",
  "....k" + "sesses" + "k....",
  "....kssssssk....",
  ".....kssssk.....",
  "......kssk......",
  "...k" + "cccccccc" + "k...",
  "..kcC" + "ccccccc" + "Cck.",
  "..kcC" + "ccccccc" + "Cck.",
  "..kcC" + "ccccccc" + "Cck.",
  "..kcC" + "ccccccc" + "Cck.",
  "..kcC" + "bbbbbbb" + "Cck.",
  "..ksC" + "ccccccc" + "Csk.",
  "...k" + "cccccccc" + "k...",
  "...k" + "cccccccc" + "k...",
  "....kppkkppk....",
  "....kppkkppk....",
  "....kppkkppk....",
  "....kppkkppk....",
  "...kbbbkkbbbk...",
  "...kkkkkkkkkk...",
];

const STEP_LEGS = {
  20: "...kppk..kppk...",
  21: "...kppk..kppk...",
  22: "..kbbbk..kbbbk..",
  23: "..kkkkk..kkkkk..",
};

// Back view (looking at the board / shelf).
const BACK = withRows(STAND, {
  4: "....khhhhhhk....",
  5: "....khhhhhhk....",
  6: "....khhhhhhk....",
  7: ".....khhhhk.....",
});
const BACK_STEP = withRows(BACK, STEP_LEGS);

// Sitting on a stool, eyes closed.
const SIT: string[] = [
  "................",
  "................",
  "................",
  "................",
  ".....kkkkkk.....",
  "....khhhhhhk....",
  "....khhhhhhk....",
  "....khsssshk....",
  "....k" + "skssks" + "k....",
  "....kssssssk....",
  ".....kssssk.....",
  "......kssk......",
  "...k" + "cccccccc" + "k...",
  "..kcC" + "ccccccc" + "Cck.",
  "..kcC" + "ccccccc" + "Cck.",
  "..kcC" + "bbbbbbb" + "Cck.",
  "..ksC" + "ccccccc" + "Csk.",
  "...k" + "ccccccc" + "pppk.",
  "...k" + "kkkkkkkk" + "pppk",
  "...........kbbbk",
  "...........kkkkk",
];

// Arms up: stretching (waking) and cheering (done).
const ARMS_UP: string[] = [
  "..ss........ss..",
  "..kk.kkkkkk.kk..",
  "..ck" + "khhhhhhk" + "kc..",
  "..ck" + "khhhhhhk" + "kc..",
  "..ck" + "khsssshk" + "kc..",
  "..ck" + "kskssksk" + "kc..",
  "..ck" + "kssoossk" + "kc..",
  "..ck" + ".kssssk." + "kc..",
  "..ck" + "..kssk.." + "kc..",
  "...kk" + "cccccc" + "kk...",
  "...k" + "cccccccc" + "k...",
  "...k" + "cccccccc" + "k...",
  "...k" + "cccccccc" + "k...",
  "...k" + "cccccccc" + "k...",
  "...k" + "cbbbbbbc" + "k...",
  "...k" + "cccccccc" + "k...",
  ...STAND.slice(16),
];
const CHEER = withRows(ARMS_UP, {
  5: "..ck" + "ksessesk" + "kc..",
  6: "..ck" + "kskkkksk" + "kc..",
});

// Holding an open scroll; two frames for the page flip.
const READ_A = withRows(STAND, {
  13: "..ks" + "WwwwwwwW" + "sk..",
  14: "..kc" + "wkkwkkww" + "ck..",
  15: "..kc" + "wwwwwwww" + "ck..",
  16: "..kc" + "wkkkwkww" + "ck..",
  17: "...k" + "WwwwwwwW" + "k...",
});
const READ_B = withRows(READ_A, {
  14: "..kc" + "wwkkwkkw" + "ck..",
  16: "..kc" + "wkwkkkww" + "ck..",
});

// Looking down at the desk (writing).
const WRITE = withRows(STAND, { 5: "....k" + "skssks" + "k...." });

const QUILL = ["....q", "...qq", "..qq.", ".qq..", "kq...", "k...."];
const GLYPH_Z = ["kkkk", "..k.", ".k..", "kkkk"];
const GLYPH_Q = [".kkk.", "k...k", "...k.", "..k..", ".....", "..k.."];
const GLYPH_X = ["kk", "kk", "kk", "kk", "..", "kk"];
const SPARKLE = [".g.", "ggg", ".g."];

const BASE_PAL: Palette = {
  k: "#24170f", s: "#f2c79a", e: "#1a1a1a", o: "#7a2a1a", b: "#5a3a22", p: "#3b3b52",
  w: "#f1e6c8", W: "#c9b283", q: "#f4f4f4", g: "#ffe066",
};
const AGENT_PAL: Record<AgentId, Palette> = {
  "jira-study": { ...BASE_PAL, h: "#7a4a22", c: "#3f7d3a", C: "#2b5a28" },        // ranger green
  "sharepoint-study": { ...BASE_PAL, h: "#d6d3cc", c: "#4b509c", C: "#353a78" },  // scribe blue, grey hair
};

// ── Props ────────────────────────────────────────────────────

function Candle({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g>
      {lit && (
        <g className="ag-flame">
          <rect x={x + 1} y={y - 4} width={1} height={1} fill="#ffe680" />
          <rect x={x} y={y - 3} width={3} height={2} fill="#ffb02e" />
          <rect x={x + 1} y={y - 2} width={1} height={1} fill="#fff3b0" />
        </g>
      )}
      <rect x={x + 1} y={y - 1} width={1} height={1} fill="#24170f" />
      <rect x={x} y={y} width={3} height={5} fill="#f3ead2" />
      <rect x={x + 2} y={y} width={1} height={5} fill="#d8ccab" />
      <rect x={x - 1} y={y + 5} width={5} height={1} fill="#8b8b8b" />
      <rect x={x - 1} y={y + 6} width={5} height={1} fill="#5e5e5e" />
    </g>
  );
}

function Window({ x, y, night }: { x: number; y: number; night: boolean }) {
  const sky = night ? "#1b2346" : "#7ec8f0";
  return (
    <g>
      <rect x={x + 2} y={y} width={12} height={2} fill="#3a2a1c" />
      <rect x={x} y={y + 2} width={16} height={22} fill="#3a2a1c" />
      <rect x={x + 2} y={y + 2} width={12} height={20} fill={sky} />
      <rect x={x + 4} y={y + 1} width={8} height={1} fill={sky} />
      {night ? (
        <g>
          <rect x={x + 9} y={y + 5} width={3} height={3} fill="#f4f1d0" />
          <rect x={x + 10} y={y + 5} width={2} height={2} fill={sky} />
          <rect x={x + 4} y={y + 12} width={1} height={1} fill="#f4f1d0" />
          <rect x={x + 11} y={y + 16} width={1} height={1} fill="#f4f1d0" />
        </g>
      ) : (
        <g>
          <rect x={x + 3} y={y + 14} width={6} height={2} fill="#ffffff" />
          <rect x={x + 4} y={y + 13} width={3} height={1} fill="#ffffff" />
          <rect x={x + 2} y={y + 18} width={12} height={4} fill="#5d9e48" />
        </g>
      )}
      <rect x={x + 7} y={y + 2} width={2} height={20} fill="#3a2a1c" />
      <rect x={x + 2} y={y + 11} width={12} height={2} fill="#3a2a1c" />
      <rect x={x - 1} y={y + 24} width={18} height={2} fill="#6b6f7c" />
    </g>
  );
}

function Banner({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 1} y={y} width={12} height={2} fill="#6b4426" />
      <rect x={x} y={y + 2} width={10} height={18} fill="#9c2a2a" />
      <rect x={x + 8} y={y + 2} width={2} height={18} fill="#7a1f1f" />
      <rect x={x} y={y + 20} width={4} height={2} fill="#9c2a2a" />
      <rect x={x + 6} y={y + 20} width={4} height={2} fill="#7a1f1f" />
      <rect x={x} y={y + 22} width={2} height={1} fill="#9c2a2a" />
      <rect x={x + 8} y={y + 22} width={2} height={1} fill="#7a1f1f" />
      <rect x={x + 3} y={y + 6} width={4} height={5} fill="#e0b84a" />
      <rect x={x + 4} y={y + 11} width={2} height={2} fill="#e0b84a" />
    </g>
  );
}

function Stool({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={12} height={2} fill="#7a4a26" />
      <rect x={x} y={y + 2} width={12} height={1} fill="#5a3a1e" />
      <rect x={x + 1} y={y + 3} width={2} height={4} fill="#5a3a1e" />
      <rect x={x + 9} y={y + 3} width={2} height={4} fill="#5a3a1e" />
    </g>
  );
}

function QuestBoard({ x, y }: { x: number; y: number }) {
  const notes: [number, number, number, number][] = [
    [4, 4, 9, 10], [16, 3, 8, 8], [27, 5, 10, 9], [6, 17, 8, 8], [18, 14, 9, 11], [30, 17, 8, 7],
  ];
  return (
    <g>
      <rect x={x} y={y} width={46} height={32} fill="#4a2f18" />
      <rect x={x + 2} y={y + 2} width={42} height={28} fill="#b07a45" />
      <rect x={x + 2} y={y + 2} width={42} height={1} fill="#c99360" />
      {notes.map(([nx, ny, w, h], i) => (
        <g key={i}>
          <rect x={x + nx} y={y + ny} width={w} height={h} fill="#f1e6c8" />
          <rect x={x + nx} y={y + ny + h - 1} width={w} height={1} fill="#c9b283" />
          <rect x={x + nx + 2} y={y + ny + 3} width={w - 4} height={1} fill="#7d6b4e" />
          <rect x={x + nx + 2} y={y + ny + 5} width={w - 5} height={1} fill="#7d6b4e" />
          <rect x={x + nx + Math.floor(w / 2)} y={y + ny} width={1} height={1} fill={i % 2 ? "#2f6fbd" : "#c0392b"} />
        </g>
      ))}
      <rect x={x + 16} y={y - 6} width={14} height={6} fill="#4a2f18" />
      <rect x={x + 17} y={y - 5} width={12} height={4} fill="#e0b84a" />
      <rect x={x + 19} y={y - 4} width={8} height={1} fill="#7a5a12" />
      <rect x={x + 19} y={y - 2} width={6} height={1} fill="#7a5a12" />
    </g>
  );
}

function Bookshelf({ x, y }: { x: number; y: number }) {
  const spines = ["#9c2a2a", "#2f6fbd", "#3f7d3a", "#e0b84a", "#6b3e8a", "#c0702b", "#2b5a28", "#f1e6c8"];
  return (
    <g>
      <rect x={x} y={y} width={30} height={38} fill="#4a2f18" />
      <rect x={x + 2} y={y + 2} width={26} height={34} fill="#2a1a0e" />
      {[0, 1, 2].map(shelf => (
        <g key={shelf}>
          {Array.from({ length: 8 }, (_, i) => {
            const h = 7 + ((i * 3 + shelf * 5) % 3);
            return (
              <rect key={i} x={x + 3 + i * 3} y={y + 2 + shelf * 12 + (10 - h)} width={2} height={h}
                fill={spines[(i + shelf * 3) % spines.length]} />
            );
          })}
          <rect x={x + 2} y={y + 12 + shelf * 12} width={26} height={2} fill="#6b4426" />
        </g>
      ))}
    </g>
  );
}

function Table({ x, y, w, children }: { x: number; y: number; w: number; children?: ReactNode }) {
  return (
    <g>
      {children}
      <rect x={x} y={y} width={w} height={3} fill="#9a6538" />
      <rect x={x} y={y} width={w} height={1} fill="#b47a48" />
      <rect x={x + 1} y={y + 3} width={w - 2} height={8} fill="#6b4426" />
      <rect x={x + 1} y={y + 10} width={w - 2} height={1} fill="#4a2f18" />
      <rect x={x + 3} y={y + 5} width={w - 6} height={1} fill="#5a381f" />
      <rect x={x + 2} y={y + 11} width={3} height={6} fill="#4a2f18" />
      <rect x={x + w - 5} y={y + 11} width={3} height={6} fill="#4a2f18" />
    </g>
  );
}

function RolledScroll({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={9} height={3} fill="#f1e6c8" />
      <rect x={x} y={y + 2} width={9} height={1} fill="#c9b283" />
      <rect x={x - 1} y={y} width={1} height={3} fill="#9a6538" />
      <rect x={x + 9} y={y} width={1} height={3} fill="#9a6538" />
      <rect x={x + 4} y={y} width={1} height={3} fill="#9c2a2a" />
    </g>
  );
}

function InkPot({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x + 3} y={y - 7} width={1} height={2} fill="#f4f4f4" />
      <rect x={x + 4} y={y - 9} width={1} height={3} fill="#f4f4f4" />
      <rect x={x + 5} y={y - 10} width={1} height={2} fill="#dcdcdc" />
      <rect x={x + 2} y={y - 5} width={1} height={3} fill="#24170f" />
      <rect x={x + 1} y={y - 3} width={4} height={1} fill="#24170f" />
      <rect x={x} y={y - 2} width={6} height={2} fill="#1d2440" />
      <rect x={x + 1} y={y - 2} width={1} height={1} fill="#4a5a9c" />
    </g>
  );
}

// ── Rooms ────────────────────────────────────────────────────

interface Spot { x: number; y: number }
interface RoomLayout {
  rest: Spot;              // standing spot beside the stool (sit sprite uses the same x)
  stool: Spot;
  walk: { from: number; to: number; y: number };
  read: Spot;
  write: Spot;
  done: Spot;
}

const LAYOUT: Record<AgentId, RoomLayout> = {
  "jira-study": {
    rest: { x: 62, y: 48 }, stool: { x: 64, y: 65 },
    walk: { from: 12, to: 40, y: 48 }, read: { x: 26, y: 48 },
    write: { x: 92, y: 42 }, done: { x: 62, y: 48 },
  },
  "sharepoint-study": {
    rest: { x: 74, y: 48 }, stool: { x: 76, y: 65 },
    walk: { from: 88, to: 106, y: 48 }, read: { x: 100, y: 48 },
    write: { x: 40, y: 40 }, done: { x: 74, y: 48 },
  },
};

function Character({ agent }: { agent: AgentStatus }) {
  const pal = AGENT_PAL[agent.id];
  const L = LAYOUT[agent.id];
  const s = agent.state;

  if (s === "sleeping" || s === "off-hours") {
    return (
      <g transform={`translate(${L.rest.x},${L.rest.y})`}>
        <g className="ag-breathe"><Sprite rows={SIT} pal={pal} /></g>
        <g className="ag-z ag-z1"><Sprite rows={GLYPH_Z} pal={{ k: "#f4f4f4" }} x={12} y={-2} /></g>
        <g className="ag-z ag-z2"><Sprite rows={GLYPH_Z} pal={{ k: "#f4f4f4" }} x={16} y={-6} /></g>
      </g>
    );
  }
  if (s === "waking") {
    return (
      <g transform={`translate(${L.rest.x},${L.rest.y})`}>
        <Sprite rows={ARMS_UP} pal={pal} className="ag-fa ag-slow" />
        <Sprite rows={STAND} pal={pal} className="ag-fb ag-slow" />
      </g>
    );
  }
  if (s === "searching") {
    const dist = L.walk.to - L.walk.from;
    return (
      <g transform={`translate(${L.walk.from},${L.walk.y})`}>
        <g className="ag-walk" style={{ ["--ag-dist" as string]: `${dist}px`, animationTimingFunction: `steps(${dist})` }}>
          <Sprite rows={BACK} pal={pal} className="ag-fa" />
          <Sprite rows={BACK_STEP} pal={pal} className="ag-fb" />
        </g>
      </g>
    );
  }
  if (s === "reading") {
    return (
      <g transform={`translate(${L.read.x},${L.read.y})`}>
        <g className="ag-bob">
          <Sprite rows={READ_A} pal={pal} className="ag-fa ag-slow" />
          <Sprite rows={READ_B} pal={pal} className="ag-fb ag-slow" />
        </g>
      </g>
    );
  }
  if (s === "writing") {
    return (
      <g transform={`translate(${L.write.x},${L.write.y})`}>
        <Sprite rows={WRITE} pal={pal} />
        <g className="ag-quill"><Sprite rows={QUILL} pal={pal} x={11} y={10} /></g>
      </g>
    );
  }
  if (s === "done") {
    return (
      <g transform={`translate(${L.done.x},${L.done.y})`}>
        <g className="ag-jump"><Sprite rows={CHEER} pal={pal} /></g>
        <g className="ag-twinkle"><Sprite rows={SPARKLE} pal={pal} x={-3} y={2} /></g>
        <g className="ag-twinkle ag-delay"><Sprite rows={SPARKLE} pal={pal} x={16} y={0} /></g>
        <g className="ag-twinkle"><Sprite rows={SPARKLE} pal={pal} x={17} y={10} /></g>
        <g className="ag-twinkle ag-delay"><Sprite rows={SPARKLE} pal={pal} x={-4} y={12} /></g>
      </g>
    );
  }
  // needs-setup / error: standing with a "?" or "!" bubble over the head.
  const err = s === "error";
  return (
    <g transform={`translate(${L.rest.x},${L.rest.y})`}>
      <Sprite rows={STAND} pal={pal} />
      <g className={err ? "ag-alert" : "ag-hover"}>
        <rect x={4} y={-13} width={9} height={10} fill="#24170f" />
        <rect x={5} y={-12} width={7} height={8} fill={err ? "#d63c3c" : "#f4f4f4"} />
        <rect x={7} y={-3} width={2} height={2} fill="#24170f" />
        {err
          ? <Sprite rows={GLYPH_X} pal={{ k: "#ffffff" }} x={7} y={-11} />
          : <Sprite rows={GLYPH_Q} pal={{ k: "#24170f" }} x={6} y={-11} />}
      </g>
    </g>
  );
}

function RoomScene({ agent }: { agent: AgentStatus }) {
  const id = agent.id;
  const night = agent.state === "off-hours";
  const lit = !night;
  const L = LAYOUT[id];
  const pid = `ag-${id}`;
  const scout = id === "jira-study";

  return (
    <svg viewBox="0 0 128 80" className="ag-svg block w-full h-auto" shapeRendering="crispEdges"
      role="img" aria-label={`${agent.name}: ${STATE_LABEL[agent.state]}`}>
      <defs>
        <pattern id={`${pid}-brick`} width="16" height="8" patternUnits="userSpaceOnUse">
          <rect width="16" height="8" fill={scout ? "#5d6170" : "#5f5a6e"} />
          <rect y="3" width="16" height="1" fill="#3f424c" />
          <rect y="7" width="16" height="1" fill="#3f424c" />
          <rect x="7" width="1" height="3" fill="#3f424c" />
          <rect x="15" y="4" width="1" height="3" fill="#3f424c" />
          <rect x="1" width="5" height="1" fill="#6c7080" />
          <rect x="9" y="4" width="5" height="1" fill="#6c7080" />
        </pattern>
        <pattern id={`${pid}-floor`} width="24" height="6" patternUnits="userSpaceOnUse">
          <rect width="24" height="6" fill="#8a5a33" />
          <rect y="5" width="24" height="1" fill="#6b4426" />
          <rect x="11" width="1" height="5" fill="#6b4426" />
          <rect x="2" y="1" width="6" height="1" fill="#9a6a3f" />
        </pattern>
      </defs>

      {/* wall + floor */}
      <rect width="128" height="56" fill={`url(#${pid}-brick)`} />
      <rect y="52" width="128" height="4" fill="#3a2a1c" />
      <rect y="52" width="128" height="1" fill="#6b4426" />
      <rect y="56" width="128" height="24" fill={`url(#${pid}-floor)`} />
      <rect y="56" width="128" height="1" fill="#4a2f18" />
      {/* rug */}
      <rect x={scout ? 44 : 62} y="70" width="40" height="7" fill="#7a1f1f" />
      <rect x={scout ? 46 : 64} y="72" width="36" height="3" fill="#9c2a2a" />

      {scout ? (
        <>
          <QuestBoard x={8} y={14} />
          <Banner x={64} y={6} />
          <Window x={104} y={8} night={night} />
          <Stool x={L.stool.x} y={L.stool.y} />
        </>
      ) : (
        <>
          <Window x={6} y={8} night={night} />
          <Banner x={42} y={6} />
          <Bookshelf x={94} y={14} />
          <Stool x={L.stool.x} y={L.stool.y} />
        </>
      )}

      <Character agent={agent} />

      {scout ? (
        <Table x={84} y={58} w={34}>
          {/* map on the table */}
          <rect x={88} y={56} width={14} height={2} fill="#e8d9a8" />
          <rect x={91} y={56} width={4} height={1} fill="#3f7d3a" />
          <Candle x={110} y={51} lit={lit} />
        </Table>
      ) : (
        <Table x={26} y={56} w={46}>
          <RolledScroll x={29} y={53} />
          <RolledScroll x={31} y={50} />
          <rect x={44} y={54} width={12} height={2} fill="#f1e6c8" />
          <InkPot x={58} y={56} />
          <Candle x={66} y={49} lit={lit} />
        </Table>
      )}

      {night && <rect width="128" height="80" fill="#070b1e" opacity="0.55" />}
    </svg>
  );
}

function SpeechBubble({ agent }: { agent: AgentStatus }) {
  const L = LAYOUT[agent.id];
  const s = agent.state;
  const spot = s === "searching" ? { x: (L.walk.from + L.walk.to) / 2 }
    : s === "reading" ? L.read : s === "writing" ? L.write : s === "done" ? L.done : L.rest;
  const left = Math.min(72, Math.max(28, ((spot.x + 8) / 128) * 100));
  const pct = agent.progress && agent.progress.total > 0
    ? Math.min(1, Math.max(0, agent.progress.done / agent.progress.total)) : null;
  const segs = 10;

  return (
    <div className="ag-bubble absolute top-[3%]" style={{ left: `${left}%` }}>
      <div className={clsx("ag-bubble-box", s === "error" && "ag-bubble-err")}>
        <p className="leading-tight">{agent.activity || STATE_LABEL[s]}</p>
        {agent.item && (
          <p className="leading-tight mt-0.5 opacity-80 truncate">
            <span className="font-bold">{agent.item.key}</span> {agent.item.title}
          </p>
        )}
        {agent.progress && (
          <div className="mt-1 flex items-center gap-1.5">
            <div className="ag-bar" aria-label={`${agent.progress.done} of ${agent.progress.total}`}>
              {Array.from({ length: segs }, (_, i) => (
                <span key={i} className={clsx("ag-seg", pct !== null && i < Math.round(pct * segs) && "ag-seg-on")} />
              ))}
            </div>
            <span className="tabular-nums">{agent.progress.done}/{agent.progress.total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const SCENE_CSS = `
.ag-scene { font-family: var(--font-pixel-body), ui-monospace, monospace; }
.ag-svg { image-rendering: pixelated; }
.ag-room { background: #1d1410; border: 4px solid #24170f; box-shadow: inset 0 0 0 2px #6b4426; }
.ag-plate { font-family: var(--font-pixel-label), var(--font-pixel-body), monospace; background: #4a2f18; color: #f1e6c8;
  border-top: 2px solid #6b4426; letter-spacing: .04em; }
.ag-bubble { transform: translateX(-50%); max-width: 62%; min-width: 40%; z-index: 2; }
.ag-bubble-box { background: #fdf8ea; color: #24170f; font-size: 11px; padding: 4px 6px;
  box-shadow: 0 -2px 0 #24170f, 0 2px 0 #24170f, -2px 0 0 #24170f, 2px 0 0 #24170f, 0 4px 0 rgba(0,0,0,.35); }
.ag-bubble-err { background: #ffe1e1; color: #6a1010; }
.ag-bar { display: flex; gap: 1px; padding: 1px; background: #24170f; }
.ag-seg { width: 6px; height: 6px; background: #c9b283; }
.ag-seg-on { background: #3f9c3a; }

.ag-fb { opacity: 0; }
.ag-fa { animation: ag-frame-a .5s steps(1, end) infinite; }
.ag-fb { animation: ag-frame-b .5s steps(1, end) infinite; }
.ag-fa.ag-slow, .ag-fb.ag-slow { animation-duration: 1.4s; }
@keyframes ag-frame-a { 0% { opacity: 1 } 50% { opacity: 0 } }
@keyframes ag-frame-b { 0% { opacity: 0 } 50% { opacity: 1 } }

.ag-walk { animation: ag-walk 7s infinite; }
@keyframes ag-walk { 0% { transform: translateX(0) } 50% { transform: translateX(var(--ag-dist)) } 100% { transform: translateX(0) } }

.ag-breathe { animation: ag-breathe 2.4s steps(1, end) infinite; }
@keyframes ag-breathe { 0% { transform: translateY(0) } 50% { transform: translateY(1px) } }

.ag-z { opacity: 0; animation: ag-z 2.4s steps(6, end) infinite; }
.ag-z2 { animation-delay: 1.2s; }
@keyframes ag-z { 0% { opacity: 0; transform: translate(0, 0) } 20% { opacity: 1 } 100% { opacity: 0; transform: translate(3px, -6px) } }

.ag-bob { animation: ag-breathe 1.4s steps(1, end) infinite; }

.ag-quill { animation: ag-quill .9s steps(1, end) infinite; }
@keyframes ag-quill { 0% { transform: translate(0, 0) } 25% { transform: translate(-2px, 1px) } 50% { transform: translate(-4px, 0) } 75% { transform: translate(-2px, 1px) } }

.ag-jump { animation: ag-jump .8s steps(1, end) infinite; }
@keyframes ag-jump { 0% { transform: translateY(0) } 50% { transform: translateY(-3px) } }

.ag-twinkle { animation: ag-twinkle 1s steps(1, end) infinite; }
.ag-delay { animation-delay: .5s; }
@keyframes ag-twinkle { 0% { opacity: 1 } 50% { opacity: 0 } }

.ag-hover { animation: ag-jump 1.6s steps(1, end) infinite; }
.ag-alert { animation: ag-shake .6s steps(1, end) infinite; }
@keyframes ag-shake { 0% { transform: translateX(0) } 25% { transform: translateX(-1px) } 50% { transform: translateX(0) } 75% { transform: translateX(1px) } }

.ag-flame { animation: ag-flame .6s steps(1, end) infinite; }
@keyframes ag-flame { 0% { transform: translateX(0) } 33% { transform: translateX(-1px) } 66% { transform: translateX(0) translateY(1px) } }

@media (prefers-reduced-motion: reduce) {
  .ag-scene * { animation: none !important; }
  .ag-scene .ag-fa { opacity: 1; }
  .ag-scene .ag-fb { opacity: 0; }
  .ag-scene .ag-z { opacity: 1; }
  .ag-scene .ag-z2 { opacity: 0; }
}
`;

function Scene({ agents }: { agents: AgentStatus[] }) {
  return (
    <div className="ag-scene grid grid-cols-1 md:grid-cols-2 gap-3">
      {agents.map(a => (
        <div key={a.id} className="ag-room relative overflow-hidden">
          <div className="relative">
            <RoomScene agent={a} />
            <SpeechBubble agent={a} />
          </div>
          <div className="ag-plate flex items-center justify-between px-2 py-1 text-[11px] uppercase">
            <span>{a.name}</span>
            <span>{STATE_LABEL[a.state]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Cards, setup, history
// ══════════════════════════════════════════════════════════════

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Copy path"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); window.setTimeout(() => setDone(false), 1200); }
        catch { /* clipboard blocked */ }
      }}
      className="shrink-0 p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800"
    >
      {done ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200 break-words">{children}</dd>
    </div>
  );
}

function AgentCard({ agent, now, onRun, runMsg }: {
  agent: AgentStatus; now: number; onRun: (id: AgentId) => void; runMsg: string | null;
}) {
  const busy = BUSY.includes(agent.state);
  const studied = agent.lastResult?.studied ?? [];
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-slate-100">{agent.name}</h2>
            <span className={clsx("text-[11px] px-2 py-0.5 rounded-full border", STATE_TONE[agent.state])}>
              {STATE_LABEL[agent.state]}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{AGENT_META[agent.id].role}</p>
        </div>
        <button
          type="button"
          onClick={() => onRun(agent.id)}
          disabled={busy}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play size={12} /> {busy ? "Running" : "Run now"}
        </button>
      </div>
      {runMsg && <p className="text-xs text-amber-300">{runMsg}</p>}

      <p className="text-sm text-slate-300">
        {agent.activity}
        {agent.item && <span className="text-slate-400"> · <span className="text-slate-200">{agent.item.key}</span> {agent.item.title}</span>}
        {agent.progress && <span className="text-slate-500"> ({agent.progress.done}/{agent.progress.total})</span>}
      </p>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        <Field label="Schedule">{agent.schedule}</Field>
        <Field label="Started">{when(agent.startedAt)}</Field>
        <Field label="Finished">{when(agent.finishedAt)}</Field>
        <Field label="Next run">
          {when(agent.nextRunAt)}
          {agent.nextRunAt && <span className="text-slate-500 text-xs"> {relative(agent.nextRunAt, now)}</span>}
        </Field>
        <Field label="Waiting in queue">{agent.queue}</Field>
        <Field label="Last result">
          {agent.lastResult == null ? "—" : agent.lastResult.ok
            ? <span className="text-green-400">OK, {studied.length} studied</span>
            : <span className="text-red-400">Failed</span>}
        </Field>
      </dl>

      {agent.lastResult?.error && (
        <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5 break-words">
          {agent.lastResult.error}
        </p>
      )}

      {studied.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Studied last run</h3>
          <ul className="flex flex-col gap-1">
            {studied.map(st => (
              <li key={`${st.key}-${st.path}`} className="bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 min-w-0">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <span className="font-medium text-slate-100 shrink-0">{st.key}</span>
                  <span className="text-slate-300 truncate flex-1">{st.title}</span>
                  <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border shrink-0",
                    st.kind === "new" ? "text-green-300 border-green-500/30 bg-green-500/10" : "text-blue-300 border-blue-500/30 bg-blue-500/10")}>
                    {st.kind === "new" ? "New" : "Update"}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5 min-w-0">
                  <code className="text-[11px] text-slate-500 truncate flex-1">{st.path}</code>
                  <CopyButton text={st.path} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Recent events</h3>
        {agent.recent.length === 0 ? (
          <p className="text-xs text-slate-500">Nothing yet.</p>
        ) : (
          <ol className="font-mono text-[11px] leading-relaxed bg-slate-950/60 border border-slate-800 rounded-lg p-2 max-h-48 overflow-y-auto">
            {agent.recent.map((ev, i) => (
              <li key={`${ev.at}-${i}`} className="flex gap-2">
                <span className="text-slate-500 shrink-0">{clock(ev.at)}</span>
                <span className="text-slate-300 break-words min-w-0">{ev.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

interface TsHealthInfo { total: number; readable: number; problems: { rel: string; reason: string }[]; checkedAt: string }

/**
 * "Test scripts readable: N / N" (Faizuddin, 2026-10-27): shows at once when a
 * workbook in the synced folder cannot be read, and why, instead of the
 * Scribe finding out mid-study. Server caches the check for 30 minutes.
 */
function TsHealth() {
  const [h, setH] = useState<TsHealthInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async (refresh: boolean) => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/agents/ts-health${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setH(await res.json());
    } catch { setErr("Could not check the test scripts."); }
    finally { setBusy(false); }
  }, []);
  // Deferred so the load's state updates happen outside the effect body.
  useEffect(() => { const t = setTimeout(() => { void load(false); }, 0); return () => clearTimeout(t); }, [load]);

  const ok = h && h.total > 0 && h.readable === h.total;
  return (
    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400">Test scripts readable:</span>
        {h ? (
          <span className={ok ? "text-sm font-semibold text-green-400" : "text-sm font-semibold text-amber-300"}>
            {h.readable} / {h.total}
          </span>
        ) : <span className="text-xs text-slate-500">{busy ? "checking…" : "—"}</span>}
        <button type="button" onClick={() => load(true)} disabled={busy}
          className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50">
          <RefreshCw size={12} className={busy ? "animate-spin" : undefined} /> Check again
        </button>
      </div>
      {h && <p className="text-[11px] text-slate-500 mt-0.5">Checked {when(h.checkedAt)}</p>}
      {err && <p className="text-xs text-amber-300 mt-1">{err}</p>}
      {h && h.problems.length > 0 && (
        <ol className="list-decimal list-inside text-xs text-slate-300 mt-2 space-y-1 max-h-48 overflow-y-auto">
          {h.problems.map(p => (
            <li key={p.rel} className="break-words">
              <span className="text-slate-200">{p.rel.split("/").pop()}</span>
              <span className="block text-amber-300/90 ml-4">{p.reason}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

interface MiroInfo { signedIn: boolean; lastOkAt: string | null; lastCheckAt: string | null; lastError: string | null; loginOpen: boolean }

/**
 * Miro sign-in for the pipeline characters (Faizuddin, 2026-10-27): they read
 * boards through their own browser (scripts/pipeline/tools/miro.mjs). He signs
 * in once in the window this button opens.
 */
function MiroSetup() {
  const [m, setM] = useState<MiroInfo | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/miro-login", { cache: "no-store" });
      if (res.ok) setM(await res.json());
    } catch { /* keep last */ }
  }, []);
  useEffect(() => {
    const first = setTimeout(() => { void load(); }, 0);
    const t = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 10000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [load]);

  async function signIn() {
    setMsg(null); setBusy(true);
    try {
      const res = await fetch("/api/agents/miro-login", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(data.error ?? "Could not open the Miro window.");
      else if (data.alreadyOpen) setMsg("The Miro window is already open. Sign in there.");
      else setMsg("Miro window opening. Sign in there; it closes by itself when done.");
    } catch {
      setMsg("Could not reach the dashboard server.");
    } finally {
      setBusy(false);
      void load();
    }
  }

  return (
    <div className="min-w-0 md:col-span-2 border-t border-slate-800 pt-3">
      <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
        <StickyNote size={14} className="text-blue-400" /> Miro
      </h2>
      <p className="text-sm mt-1">
        {m?.loginOpen
          ? <span className="text-blue-300">Sign-in window open</span>
          : m?.signedIn
            ? <span className="text-green-400">Signed in</span>
            : <span className="text-amber-300">Not signed in</span>}
      </p>
      {m?.lastOkAt && <p className="text-xs text-slate-500 mt-0.5">Last worked {when(m.lastOkAt)}</p>}
      {m && !m.signedIn && m.lastError && <p className="text-xs text-slate-500 mt-0.5">{m.lastError}</p>}
      <p className="text-xs text-slate-400 mt-1">
        A Miro window opens. Sign in there once; the agents then read boards on their own.
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        <button type="button" onClick={signIn} disabled={busy || !!m?.loginOpen}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40">
          <StickyNote size={12} /> {m?.signedIn ? "Sign in to Miro again" : "Sign in to Miro"}
        </button>
      </div>
      {msg && <p className="text-xs text-slate-300 mt-2">{msg}</p>}
    </div>
  );
}

function SetupPanel({ setup, onChanged }: { setup: SetupInfo | null; onChanged: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function connect() {
    setMsg(null);
    const creds = getStoredCredentials();
    if (!creds || !creds.baseUrl || !creds.email || !creds.apiToken) {
      setMsg("No Jira login found on this dashboard. Add it in Settings first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/agents/jira-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken,
          ...(creds.accountId ? { accountId: creds.accountId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? "Agents connected to Jira." : (data.error ?? "Could not save the Jira login."));
    } catch {
      setMsg("Could not reach the dashboard server.");
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  async function disconnect() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/agents/jira-login", { method: "DELETE" });
      setMsg(res.ok ? "Agents disconnected from Jira." : "Could not remove the Jira login.");
    } catch {
      setMsg("Could not reach the dashboard server.");
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Link2 size={14} className="text-blue-400" /> Jira
        </h2>
        <p className="text-sm mt-1">
          {setup?.jira
            ? <span className="text-green-400">Connected</span>
            : <span className="text-amber-300">Not connected</span>}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          The Jira Scout uses your Jira login from this dashboard. Connecting copies it to this computer for the agents.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <button type="button" onClick={connect} disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40">
            <Link2 size={12} /> {setup?.jira ? "Update Jira login" : "Connect agents to Jira"}
          </button>
          {setup?.jira && (
            <button type="button" onClick={disconnect} disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40">
              <Unlink size={12} /> Disconnect
            </button>
          )}
        </div>
        {msg && <p className="text-xs text-slate-300 mt-2">{msg}</p>}
      </div>

      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <FolderSync size={14} className="text-blue-400" /> SharePoint
        </h2>
        {setup?.sharepointDir ? (
          <>
            <p className="text-sm text-green-400 mt-1">Synced folder found</p>
            <div className="flex items-center gap-1 mt-1 min-w-0">
              <code className="text-xs text-slate-300 truncate flex-1">{setup.sharepointDir}</code>
              <CopyButton text={setup.sharepointDir} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Checked {when(setup.checkedAt)}</p>
            <TsHealth />
          </>
        ) : (
          <>
            <p className="text-sm text-amber-300 mt-1">Synced folder not found</p>
            <p className="text-xs text-slate-400 mt-1">The SharePoint Scribe needs the test scripts library synced to this computer:</p>
            <ol className="list-decimal list-inside text-xs text-slate-300 mt-1 space-y-0.5">
              <li>Open the QA Team SharePoint site.</li>
              <li>Go to Documents → &quot;1. eAuto Project&quot; → &quot;eAuto - CR Test Scenarios&quot;.</li>
              <li>Click &quot;Sync&quot; (or &quot;Add shortcut to My files&quot;).</li>
              <li>Wait for OneDrive to finish syncing. The agent finds the folder on its next run.</li>
            </ol>
            {setup?.checkedAt && <p className="text-xs text-slate-500 mt-1">Last checked {when(setup.checkedAt)}</p>}
          </>
        )}
      </div>

      <MiroSetup />
    </section>
  );
}

function RunHistory({ runs }: { runs: AgentRunRecord[] }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-w-0">
      <h2 className="text-sm font-semibold text-slate-100 mb-2">Run history</h2>
      {runs.length === 0 ? (
        <p className="text-xs text-slate-500">No finished runs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="py-1.5 pr-3 font-medium">Agent</th>
                <th className="py-1.5 pr-3 font-medium">Started</th>
                <th className="py-1.5 pr-3 font-medium">Took</th>
                <th className="py-1.5 pr-3 font-medium text-right">Found</th>
                <th className="py-1.5 pr-3 font-medium text-right">Studied</th>
                <th className="py-1.5 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={`${r.id}-${r.startedAt}-${i}`} className="border-b border-slate-800/60 last:border-0">
                  <td className="py-1.5 pr-3 text-slate-200 whitespace-nowrap">{AGENT_META[r.id]?.name ?? r.id}</td>
                  <td className="py-1.5 pr-3 text-slate-300 whitespace-nowrap">{when(r.startedAt)}</td>
                  <td className="py-1.5 pr-3 text-slate-400 whitespace-nowrap">{duration(r.startedAt, r.finishedAt)}</td>
                  <td className="py-1.5 pr-3 text-slate-300 text-right tabular-nums">{r.found}</td>
                  <td className="py-1.5 pr-3 text-slate-300 text-right tabular-nums">{r.studied?.length ?? 0}</td>
                  <td className="py-1.5" title={r.error ?? ""}>
                    {r.ok
                      ? <span className="text-green-400">OK</span>
                      : <span className="text-red-400">Error{r.error ? `: ${r.error.slice(0, 60)}` : ""}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════════

export default function AgentsPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [runMsg, setRunMsg] = useState<Partial<Record<AgentId, string>>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agents/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as StatusResponse);
      setLoadError(null);
    } catch (e) {
      setLoadError(`Could not load agent status (${(e as Error).message}).`);
    }
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") void load(); };
    tick();
    const h = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(h); document.removeEventListener("visibilitychange", tick); };
  }, [load]);

  async function runNow(id: AgentId) {
    setRunMsg(m => ({ ...m, [id]: undefined }));
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json().catch(() => ({}));
      setRunMsg(m => ({ ...m, [id]: res.ok ? "Started. The picture updates in a few seconds." : (body.error ?? `Could not start (HTTP ${res.status}).`) }));
    } catch {
      setRunMsg(m => ({ ...m, [id]: "Could not reach the dashboard server." }));
    }
    window.setTimeout(() => void load(), 1500);
  }

  const agents = data?.agents ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <Bot size={16} className="text-blue-400" />
        <h1 className="text-sm font-semibold text-slate-200">Agents</h1>
        <span className="text-xs text-slate-500 hidden md:block">Scheduled study agents and what they are doing now</span>
        <button type="button" onClick={() => void load()} title="Refresh"
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
          <RefreshCw size={14} />
        </button>
      </header>

      <div className="flex-1 px-4 sm:px-6 py-5 flex flex-col gap-5 min-w-0 max-w-6xl w-full mx-auto">
        {loadError && (
          <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle size={14} /> {loadError}
          </p>
        )}

        {!data && !loadError && <p className="text-sm text-slate-500">Loading…</p>}

        {agents.length > 0 && (
          <>
            <Scene agents={agents} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {agents.map(a => (
                <AgentCard key={a.id} agent={a} now={now} onRun={runNow} runMsg={runMsg[a.id] ?? null} />
              ))}
            </div>
          </>
        )}

        {data && <SetupPanel setup={data.setup} onChanged={() => void load()} />}
        {data && <RunHistory runs={data.runs} />}
      </div>

      <style>{SCENE_CSS}</style>
    </div>
  );
}
