// The big room on the pipeline board (Faizuddin, 2026-10-27): "one big room
// where the characters can actually move and interact". This file has no
// React: the room layout, which character works on which ticket (from real
// data), and the little walking simulation that moves each character from
// where it is to where the data says it should be.
//
// Units: one room unit = one pixel of RoomScene's art; a character sprite is
// 12 x 16 units. A point is where a character's feet are.
import { ACTIVE_JOB } from "@/components/pipeline/api";
import { displayStage, roomFor } from "@/components/pipeline/rooms";
import type { Character, PipelineJob, PipelineStage, PipelineTicket } from "@/lib/pipeline/types";

export const ROOM_W = 360;
export const ROOM_H = 190;
/** Bottom of the back wall. */
export const WALL = 46;
/** The walkway between the back row and the front row of stations. */
export const AISLE = 116;
/** Left edge of the rest area (tea, kitchen, armchair, bunks). */
export const REST_X = 236;

export type Pt = { x: number; y: number };
export const CHARACTERS: Character[] = ["scout", "scribe", "elf", "dwarf", "sage"];

// ── stations ────────────────────────────────────────────────────────

export type StationId = "door" | "scout" | "scribe" | "elf" | "sage" | "forge" | "bench" | "board" | "done";

export interface Station {
  id: StationId;
  label: string;
  /** Walk from the aisle to the first work spot (last point = spots[0]). */
  approach: Pt[];
  /** Where workers stand (up to two at once). */
  spots: Pt[];
  /** Where finished ticket cards wait for the next character (card bottom centre). */
  tray: Pt;
  /** Where the card a worker is busy with is pinned, per spot (card top centre). */
  pins: Pt[];
  /** Where the label plate sits. */
  plate: Pt;
  /** Centre of the warm light pool when someone works here. */
  light: Pt;
}

/** Back-row desk 42 wide at x; workers stand behind it. */
export const DESK_W = 42;
export const DESK_TOP = 78;
const desk = (id: StationId, label: string, x: number): Station => ({
  id, label,
  approach: [{ x: x - 4, y: AISLE }, { x: x - 4, y: 82 }, { x: x + 11, y: 82 }],
  // Second spot at x + 23 (r6, 2026-10-28: at x + 25 the sprite touched the tray stack).
  spots: [{ x: x + 11, y: 82 }, { x: x + 23, y: 82 }],
  tray: { x: x + 36, y: DESK_TOP },
  // On the desk top (78-83), not half over the drawer front.
  pins: [{ x: x + 11, y: 78.5 }, { x: x + 23, y: 78.5 }],
  plate: { x: x + 21, y: 97 },
  light: { x: x + 21, y: 74 },
});

export const DESK_X = { scout: 30, scribe: 80, elf: 130, sage: 180 } as const;
export const FURNACE = { x: 2, y: 108, w: 18 };
export const BENCH = { x: 88, w: 40, top: 134 };
export const NOTICE = { x: 132, w: 40, top: 116, bottom: 138 };
export const CHEST = { x: 184, w: 42, top: 132 };

export const STATIONS: Record<StationId, Station> = {
  door: {
    id: "door", label: "Inbox",
    approach: [{ x: 13, y: AISLE }, { x: 13, y: 76 }],
    spots: [{ x: 13, y: 76 }, { x: 13, y: 76 }],
    tray: { x: 13, y: 60 },
    pins: [{ x: 13, y: 62 }, { x: 13, y: 62 }],
    plate: { x: 13, y: 97 },
    light: { x: 13, y: 60 },
  },
  scout: desk("scout", "Study · Scout", DESK_X.scout),
  scribe: desk("scribe", "Related · Scribe", DESK_X.scribe),
  elf: desk("elf", "Scenarios · Elf", DESK_X.elf),
  // The Sage stands on a step behind his desk (feet 3 units higher) so more
  // than his hat shows over it (2026-10-28 polish).
  sage: (() => {
    const d = desk("sage", "Knowledge · Sage", DESK_X.sage);
    const x = DESK_X.sage;
    return { ...d, approach: [{ x: x - 4, y: AISLE }, { x: x - 4, y: 79 }, { x: x + 11, y: 79 }], spots: [{ x: x + 11, y: 79 }, { x: x + 11, y: 79 }] };
  })(),
  forge: {
    id: "forge", label: "Automation · Dwarf",
    approach: [{ x: 28, y: AISLE }, { x: 28, y: 146 }],
    spots: [{ x: 28, y: 146 }, { x: 60, y: 146 }],
    tray: { x: 11, y: FURNACE.y },
    // The card lies on the anvil being worked (BigRoomScenery ANVIL_X).
    pins: [{ x: 38, y: 136.5 }, { x: 70, y: 136.5 }],
    plate: { x: 40, y: 164 },
    light: { x: 36, y: 132 },
  },
  bench: {
    id: "bench", label: "Testing · Elf",
    approach: [{ x: 98, y: AISLE }, { x: 98, y: 140 }],
    spots: [{ x: 98, y: 140 }, { x: 112, y: 140 }],
    tray: { x: 122, y: BENCH.top },
    pins: [{ x: 98, y: 136 }, { x: 112, y: 136 }],
    plate: { x: 108, y: 164 },
    light: { x: 106, y: 128 },
  },
  board: {
    id: "board", label: "Findings · Elf & Scout",
    approach: [{ x: 126, y: AISLE }, { x: 126, y: 150 }],
    spots: [{ x: 126, y: 150 }, { x: 178, y: 150 }],
    tray: { x: 152, y: 136 },
    pins: [{ x: 140, y: 118.5 }, { x: 164, y: 118.5 }],
    plate: { x: 152, y: 164 },
    light: { x: 152, y: 130 },
  },
  done: {
    id: "done", label: "Done",
    approach: [{ x: 196, y: AISLE }, { x: 196, y: 150 }],
    spots: [{ x: 196, y: 150 }, { x: 214, y: 150 }],
    tray: { x: 205, y: CHEST.top },
    pins: [{ x: 205, y: CHEST.top }, { x: 205, y: CHEST.top }],
    plate: { x: 205, y: 164 },
    light: { x: 205, y: 130 },
  },
};

/** Stations a ticket card rests at, per saved stage. */
export const STAGE_STATION: Record<PipelineStage, StationId> = {
  studied: "scout",
  related: "scribe",
  scenarios: "elf",
  approved: "elf",
  automation: "forge",
  testing: "bench",
  findings: "board",
  raised: "board",
  done: "done",
};

/** True when the actor's feet are on one of the station's work spots. */
export function standsAt(a: Pt, s: Station): boolean {
  return s.spots.some(p => Math.abs(p.x - a.x) < 0.5 && Math.abs(p.y - a.y) < 0.5);
}

/** Where a character pictures picking a card up: the second spot, next to the tray. */
export function pickSpot(s: Station): Pt[] {
  if (s.id === "door") return s.approach;
  const last = s.spots[1];
  return [...s.approach.slice(0, -1), last];
}

// ── rest area ───────────────────────────────────────────────────────

export type RestKind = "tea" | "cook" | "read" | "look" | "wander";
export interface RestSpot { kind: RestKind; at: Pt; facing: 1 | -1 }
export const REST_SPOTS: RestSpot[] = [
  { kind: "tea", at: { x: 250, y: 86 }, facing: 1 },
  { kind: "tea", at: { x: 291, y: 86 }, facing: -1 },
  { kind: "cook", at: { x: 304, y: 68 }, facing: 1 },
  { kind: "read", at: { x: 346, y: 100 }, facing: 1 },
  { kind: "look", at: { x: 270, y: 62 }, facing: 1 },
  { kind: "wander", at: { x: 302, y: 106 }, facing: -1 },
  { kind: "wander", at: { x: 258, y: 104 }, facing: 1 },
];

/** Bunk beds: three bunks, two beds each. `base` = mattress top; `x` = pillow end. */
export interface Bed { x: number; base: number; exit: Pt }
const BUNK_X = [240, 274, 308];
export const BUNK = { w: 28, top: 120, bottom: 170, upper: 140, lower: 164 };
const bunkBed = (b: number, upper: boolean): Bed => ({
  x: BUNK_X[b] + 3, base: upper ? BUNK.upper : BUNK.lower, exit: { x: BUNK_X[b] + 14, y: 118 },
});
export const BUNK_LEFT = BUNK_X;
export const BEDS: Record<Character, Bed> = {
  scout: bunkBed(0, false),
  scribe: bunkBed(0, true),
  elf: bunkBed(1, false),
  dwarf: bunkBed(1, true),
  sage: bunkBed(2, false),
};
/** Bedrolls for second copies (Elf 2 etc.): a row on the floor in front of the bunks. */
export const BEDROLLS: Record<Character, Bed> = Object.fromEntries(CHARACTERS.map((c, i) => [c, {
  x: 239 + i * 24, base: 186, exit: { x: 247 + i * 24, y: 178 },
}])) as Record<Character, Bed>;

// ── who works on what (real data only) ──────────────────────────────

export type WorkMode = "work" | "wait" | "error";
export interface Assign {
  actor: string;          // "elf-1", "elf-2"
  character: Character;
  slot: number;
  key: string;
  mode: WorkMode;
  station: StationId;
  activity: string;
}

const RANK: Record<WorkMode, number> = { work: 3, wait: 2, error: 1 };
/** Copies per character at once (Elf 1 + Elf 2); the Sage works alone. */
export const SLOTS_PER_CHARACTER = 2;
const slotsOf = (c: Character) => (c === "sage" ? 1 : SLOTS_PER_CHARACTER);

/** The station a character works at for a ticket. */
export function stationFor(c: Character, t: PipelineTicket | undefined, action?: PipelineJob["action"]): StationId {
  if (c === "sage") return "sage";
  const room = roomFor(c, t?.stage ?? "studied", action);
  if (c === "elf" && room === "testing") return "bench";
  if (c === "scout" && room !== "raised" && room !== "findings") return "scout";
  if (c === "scribe") return "scribe";
  if (c === "dwarf") return "forge";
  return STAGE_STATION[room];
}

/**
 * Up to two copies per character, each on one ticket. Running jobs come
 * first, then saved character states (working > waiting > error). `prev`
 * (actor → key) keeps a copy on the ticket it already has.
 */
export function computeAssignments(tickets: PipelineTicket[], jobs: PipelineJob[], prev: Map<string, string>): Assign[] {
  const byKey = new Map(tickets.map(t => [t.key, t]));
  type Cand = Omit<Assign, "actor" | "slot"> & { want?: number };
  const cands = new Map<string, Cand>();
  const offer = (c: Cand) => {
    const id = `${c.character}:${c.key}`;
    const cur = cands.get(id);
    if (!cur || RANK[c.mode] > RANK[cur.mode]) cands.set(id, c);
  };
  for (const j of jobs) {
    if (!ACTIVE_JOB(j) || !CHARACTERS.includes(j.character)) continue;
    offer({
      character: j.character, key: j.key, mode: "work", want: j.slot,
      station: stationFor(j.character, byKey.get(j.key), j.action),
      activity: j.activity || (j.state === "queued" ? "Getting ready" : "Working"),
    });
  }
  for (const t of tickets) {
    for (const c of CHARACTERS) {
      const cs = t.characters?.[c];
      if (!cs || cs.state === "idle" || !cs.state) continue;
      const mode: WorkMode = cs.state === "working" ? "work" : cs.state === "waiting" ? "wait" : "error";
      offer({
        character: c, key: t.key, mode, station: stationFor(c, t),
        activity: cs.note || (mode === "work" ? "Working" : mode === "wait" ? "Has a question for you" : "Stopped with an error"),
      });
    }
  }
  const out: Assign[] = [];
  for (const c of CHARACTERS) {
    const list = [...cands.values()].filter(x => x.character === c)
      .sort((a, b) => RANK[b.mode] - RANK[a.mode] || a.key.localeCompare(b.key))
      .slice(0, slotsOf(c));
    const free = new Set(Array.from({ length: slotsOf(c) }, (_, i) => i + 1));
    const placed: (Cand & { slot?: number })[] = list.map(x => ({ ...x }));
    // 1) a running job's own slot; 2) the copy that already holds the ticket; 3) any free copy.
    for (const x of placed) if (x.want && free.has(x.want)) { x.slot = x.want; free.delete(x.want); }
    for (const x of placed) {
      if (x.slot) continue;
      const keep = [...free].find(n => prev.get(`${c}-${n}`) === x.key);
      if (keep) { x.slot = keep; free.delete(keep); }
    }
    for (const x of placed) {
      if (x.slot) continue;
      const n = [...free][0];
      if (!n) continue;
      x.slot = n; free.delete(n);
    }
    for (const x of placed) {
      if (!x.slot) continue;
      out.push({ actor: `${c}-${x.slot}`, character: c, slot: x.slot, key: x.key, mode: x.mode, station: x.station, activity: x.activity });
    }
  }
  return out;
}

// ── the walking simulation ──────────────────────────────────────────

export type Mode = "sleep" | "walk" | "stand" | WorkMode | RestKind;

type Step =
  | { k: "walk"; to: Pt; enter?: boolean; exit?: boolean }
  | { k: "pick"; key: string }
  | { k: "hold"; key: string }
  | { k: "drop" }
  | { k: "pose"; mode: Mode; facing?: 1 | -1; ms?: number }
  | { k: "sleep" }
  | { k: "then"; fn: (a: Actor, now: number) => Step[] };

export interface Actor {
  id: string;
  character: Character;
  slot: number;
  x: number;
  y: number;
  facing: 1 | -1;
  mode: Mode;
  /** Ticket card (or Sage's scroll) in hand. */
  carrying: string | null;
  assign: Assign | null;
  visible: boolean;
  /** Points walked in from the aisle to where the actor is now. */
  path: Pt[];
  plan: Step[];
  stepUntil: number;
  nextRest: number;
  /** Station the actor is standing at (for its light), when there. */
  at: StationId | null;
  restSpot: number | null;
}

const SPEED = 38; // units per second
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class RoomEngine {
  actors = new Map<string, Actor>();
  tickets = new Map<string, PipelineTicket>();
  /** Cards that came in after the page opened start at the inbox. */
  atDoor = new Set<string>();
  /** Running jobs, so a resting card sits where the stage list shows it (displayStage). */
  jobs: PipelineJob[] = [];
  /**
   * Cards a copy is on its way to pick up: the station they lay at before the
   * job started, so the card stays put until it is picked up (r7, 2026-10-28).
   */
  pickFrom = new Map<string, StationId>();
  /** Bumped whenever something other than a position changes (React re-renders on it). */
  version = 0;
  reduced = false;
  private seen: Set<string> | null = null;

  constructor() {
    const now = performance.now();
    for (const c of CHARACTERS) this.actors.set(`${c}-1`, this.newActor(c, 1, true, now));
  }

  private newActor(c: Character, slot: number, visible: boolean, now: number): Actor {
    const bed = this.bedOf(c, slot);
    return {
      id: `${c}-${slot}`, character: c, slot, x: bed.exit.x, y: bed.exit.y, facing: 1, mode: "sleep",
      carrying: null, assign: null, visible, path: [{ x: bed.exit.x, y: AISLE }, bed.exit], plan: [],
      stepUntil: 0, nextRest: now + rand(4000, 30000), at: null, restSpot: null,
    };
  }

  bedOf(c: Character, slot: number): Bed {
    return slot === 1 ? BEDS[c] : BEDROLLS[c];
  }

  private bump() { this.version++; }

  actor(c: Character, slot: number): Actor {
    const id = `${c}-${slot}`;
    let a = this.actors.get(id);
    if (!a) { a = this.newActor(c, slot, false, performance.now()); this.actors.set(id, a); }
    return a;
  }

  /** Who is holding which ticket now (actor id → key), for keeping assignments stable. */
  holders(): Map<string, string> {
    const m = new Map<string, string>();
    for (const a of this.actors.values()) if (a.assign) m.set(a.id, a.assign.key);
    return m;
  }

  /**
   * Station where an unheld card rests. Uses the same column as the stage list
   * below the room (displayStage: the saved stage moved forward to a running
   * job's room), so tray and list agree (r7, 2026-10-28; before, the tray used
   * the saved stage only). A card waiting to be picked up stays where it lay.
   */
  restStation(key: string): StationId {
    if (this.atDoor.has(key)) return "door";
    const from = this.pickFrom.get(key);
    if (from) return from;
    const t = this.tickets.get(key);
    return t ? STAGE_STATION[displayStage(t, this.jobs)] ?? "scout" : "done";
  }

  isHeld(key: string): boolean {
    for (const a of this.actors.values()) if (a.carrying === key && a.character !== "sage") return true;
    return false;
  }

  // ── routes ──
  private exitSteps(a: Actor): Step[] {
    if (!a.path.length) return [{ k: "walk", to: { x: a.x, y: AISLE } }];
    return [...a.path].reverse().map(p => ({ k: "walk" as const, to: p, exit: true }));
  }

  private routeTo(a: Actor, approach: Pt[]): Step[] {
    return [...this.exitSteps(a), ...approach.map(p => ({ k: "walk" as const, to: p, enter: true }))];
  }

  private wakeSteps(a: Actor): Step[] {
    if (a.mode !== "sleep") return [];
    return [{ k: "pose", mode: "stand", ms: 700 }];
  }

  private stationRoute(a: Actor, s: Station, spot: number): Step[] {
    const target = s.spots[Math.min(spot, s.spots.length - 1)];
    // Already at this station (picked the card up from its own tray): step across.
    if (standsAt(a, s)) {
      return [{ k: "walk", to: target, enter: true }];
    }
    const ap = s.approach.slice(0, -1);
    const last = s.approach[s.approach.length - 1];
    // Second spot: walk on along the same line (behind the desk / beside the bench).
    const tail = target.x === last.x && target.y === last.y ? [last] : [last, target];
    return this.routeTo(a, [...ap, ...tail]);
  }

  private bedSteps(a: Actor): Step[] {
    const bed = this.bedOf(a.character, a.slot);
    return [...this.routeTo(a, [{ x: bed.exit.x, y: AISLE }, bed.exit]), { k: "sleep" }];
  }

  /** Spot index for an actor at a station: the order among actors assigned there. */
  private spotIndex(assigns: Assign[], as: Assign): number {
    const here = assigns.filter(x => x.station === as.station).map(x => x.actor).sort();
    return Math.max(0, here.indexOf(as.actor));
  }

  // ── data in ──
  update(tickets: PipelineTicket[], jobs: PipelineJob[]) {
    const now = performance.now();
    // Where each card shows now, before the new jobs move its column.
    const shownBefore = new Map<string, StationId>();
    for (const k of this.tickets.keys()) shownBefore.set(k, this.restStation(k));
    this.tickets = new Map(tickets.map(t => [t.key, t]));
    this.jobs = jobs;
    const first = this.seen === null;
    if (first) this.seen = new Set(tickets.map(t => t.key));
    else {
      for (const t of tickets) {
        if (!this.seen!.has(t.key)) { this.seen!.add(t.key); if (t.stage === "studied") this.atDoor.add(t.key); }
      }
    }
    const assigns = computeAssignments(tickets, jobs, this.holders());
    const byActor = new Map(assigns.map(x => [x.actor, x]));
    for (const as of assigns) this.actor(as.character, as.slot);
    const instant = first || this.reduced;

    for (const a of this.actors.values()) {
      const next = byActor.get(a.id) ?? null;
      const cur = a.assign;
      if (!next && !cur) continue;
      if (next && cur && next.key === cur.key && next.station === cur.station) {
        // Same job, new mode or words.
        a.assign = next;
        if (cur.mode !== next.mode) {
          if (!a.plan.length && (a.mode === "work" || a.mode === "wait" || a.mode === "error")) a.mode = next.mode;
          else {
            const last = a.plan[a.plan.length - 1];
            if (last && last.k === "pose") last.mode = next.mode;
          }
        }
        this.bump();
        continue;
      }
      a.assign = next;
      a.restSpot = null;
      if (next) {
        a.visible = true;
        const st = STATIONS[next.station];
        const spot = this.spotIndex(assigns, next);
        if (instant) {
          const p = st.spots[spot];
          a.x = p.x; a.y = p.y; a.path = [...st.approach.slice(0, -1), p];
          a.mode = next.mode; a.carrying = next.key; a.plan = []; a.at = st.id; a.facing = 1;
          this.atDoor.delete(next.key);
          continue;
        }
        a.plan = [...this.wakeSteps(a)];
        a.at = null;
        // Put down another ticket's card first.
        if (a.carrying && a.carrying !== next.key) a.plan.push(...this.dropRoute(a, a.carrying));
        if (a.character === "sage") {
          a.plan.push({ k: "then", fn: (b) => this.stationRoute(b, st, spot) }, { k: "hold", key: next.key });
        } else if (a.carrying !== next.key) {
          const key = next.key;
          if (!this.isHeld(key) && !this.pickFrom.has(key)) {
            const t = this.tickets.get(key);
            const was = shownBefore.get(key) ?? (t ? STAGE_STATION[t.stage] : undefined);
            if (was) this.pickFrom.set(key, was);
          }
          a.plan.push({
            k: "then",
            fn: (b) => {
              if (this.isHeld(key)) return [...this.stationRoute(b, st, spot), { k: "hold", key }];
              const from = STATIONS[this.restStation(key)];
              const walkIn = from.id === st.id ? this.stationRoute(b, st, 1) : this.routeTo(b, pickSpot(from));
              return [...walkIn, { k: "pose", mode: "stand", ms: 500 }, { k: "pick", key }, ...(from.id === st.id && spot === 1 ? [] : this.thenStation(st, spot))];
            },
          });
        } else {
          a.plan.push({ k: "then", fn: (b) => this.stationRoute(b, st, spot) });
        }
        a.plan.push({ k: "pose", mode: next.mode, facing: 1 });
        a.stepUntil = 0;
      } else {
        // Work over: put the card where its ticket now rests, then back to bed.
        if (instant) {
          const bed = this.bedOf(a.character, a.slot);
          a.x = bed.exit.x; a.y = bed.exit.y; a.path = [{ x: bed.exit.x, y: AISLE }, bed.exit];
          a.mode = "sleep"; a.carrying = null; a.plan = []; a.at = null;
          continue;
        }
        a.plan = [{ k: "pose", mode: "stand", ms: 1200 }];
        if (a.carrying) {
          const key = a.carrying;
          a.plan.push({ k: "then", fn: (b) => this.dropRoute(b, key) });
        }
        a.plan.push({ k: "then", fn: (b) => this.bedSteps(b) });
        a.stepUntil = 0;
        a.nextRest = now + rand(20000, 60000);
      }
      this.bump();
    }
    // Forget pick-up spots nobody is still walking to.
    for (const key of [...this.pickFrom.keys()]) {
      const going = [...this.actors.values()].some(a => a.assign?.key === key && a.carrying !== key && a.character !== "sage");
      if (!going) this.pickFrom.delete(key);
    }
  }

  private thenStation(st: Station, spot: number): Step[] {
    return [{ k: "then", fn: (b) => this.stationRoute(b, st, spot) }];
  }

  /** Walk a held card to the station where its ticket rests, and put it down. */
  private dropRoute(a: Actor, key: string): Step[] {
    if (a.character === "sage") return [{ k: "drop" }];
    return [{
      k: "then",
      fn: (b) => {
        const rest = STATIONS[this.restStation(key)];
        // Standing at that station already (`at` is cleared when new work comes in,
        // so check the feet): put it straight down instead of walking out and back.
        if (b.at === rest.id || standsAt(b, rest)) return [{ k: "drop" }];
        return [...this.routeTo(b, pickSpot(rest)), { k: "pose", mode: "stand", ms: 400 }, { k: "drop" }];
      },
    }];
  }

  // ── time ──
  /** Advances everyone by dt ms. Returns true when something visible moved. */
  tick(now: number, dt: number): boolean {
    let moved = false;
    for (const a of this.actors.values()) {
      if (!a.visible) continue;
      if (!a.plan.length) { this.idle(a, now); if (!a.plan.length) continue; }
      let budget = dt;
      let guard = 0;
      while (a.plan.length && guard++ < 20) {
        const s = a.plan[0];
        if (s.k === "then") { a.plan.splice(0, 1, ...s.fn(a, now)); continue; }
        if (s.k === "walk") {
          const dx = s.to.x - a.x, dy = s.to.y - a.y;
          const d = Math.hypot(dx, dy);
          if (this.reduced) { a.x = s.to.x; a.y = s.to.y; }
          else if (d > 0.01) {
            if (a.mode !== "walk") { a.mode = "walk"; this.bump(); }
            if (Math.abs(dx) > 0.5) { const f = dx > 0 ? 1 : -1; if (f !== a.facing) { a.facing = f; this.bump(); } }
            const step = (SPEED * budget) / 1000;
            if (step < d) { a.x += (dx / d) * step; a.y += (dy / d) * step; moved = true; break; }
            budget -= (d / SPEED) * 1000;
            a.x = s.to.x; a.y = s.to.y; moved = true;
          }
          if (s.enter) a.path.push(s.to);
          if (s.exit) a.path.pop();
          a.at = null;
          a.plan.shift();
          continue;
        }
        if (s.k === "pose") {
          if (a.mode !== s.mode || (s.facing && s.facing !== a.facing)) {
            a.mode = s.mode; if (s.facing) a.facing = s.facing; this.bump();
          }
          if (a.assign && (s.mode === "work" || s.mode === "wait" || s.mode === "error")) a.at = a.assign.station;
          if (!s.ms) { a.plan.shift(); continue; }
          if (!a.stepUntil) a.stepUntil = now + (this.reduced ? 0 : s.ms);
          if (now < a.stepUntil) break;
          a.stepUntil = 0;
          a.plan.shift();
          continue;
        }
        if (s.k === "pick" || s.k === "hold") {
          a.carrying = s.key; this.atDoor.delete(s.key); this.pickFrom.delete(s.key); this.bump(); a.plan.shift(); continue;
        }
        if (s.k === "drop") { a.carrying = null; this.bump(); a.plan.shift(); continue; }
        if (s.k === "sleep") {
          a.mode = "sleep"; a.at = null; a.facing = 1; this.bump(); a.plan.shift();
          a.nextRest = now + rand(25000, 70000);
          continue;
        }
      }
    }
    return moved;
  }

  /** Idle life: mostly asleep; now and then up for tea, cooking, a read or a look outside. */
  private idle(a: Actor, now: number) {
    if (a.assign || this.reduced || a.slot !== 1) return;
    if (a.mode !== "sleep" || now < a.nextRest) return;
    const taken = new Set([...this.actors.values()].map(x => x.restSpot).filter(n => n !== null));
    const free = REST_SPOTS.map((_, i) => i).filter(i => !taken.has(i));
    if (!free.length) { a.nextRest = now + 10000; return; }
    const i = free[Math.floor(Math.random() * free.length)];
    const spot = REST_SPOTS[i];
    a.restSpot = i;
    const ms = spot.kind === "wander" ? rand(3000, 6000) : rand(9000, 18000);
    a.plan = [
      ...this.wakeSteps(a),
      ...this.routeTo(a, [{ x: spot.at.x, y: AISLE }, spot.at]),
      { k: "pose", mode: spot.kind === "wander" ? "stand" : spot.kind, facing: spot.facing, ms },
      { k: "then", fn: (b) => { b.restSpot = null; return this.bedSteps(b); } },
    ];
    this.bump();
  }

  setReduced(r: boolean) {
    this.reduced = r;
    if (!r) return;
    // Jump everyone to where the data says; idle ones back to bed.
    for (const a of this.actors.values()) {
      if (!a.assign && a.mode !== "sleep") {
        const bed = this.bedOf(a.character, a.slot);
        a.x = bed.exit.x; a.y = bed.exit.y; a.path = [{ x: bed.exit.x, y: AISLE }, bed.exit];
        a.mode = "sleep"; a.plan = []; a.restSpot = null; a.carrying = null;
      }
    }
    this.bump();
  }
}
