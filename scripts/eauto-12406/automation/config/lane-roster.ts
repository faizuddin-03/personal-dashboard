import * as fs from "node:fs";
import * as path from "node:path";

/** One lane of env/lanes.json: a UCD user, its company and whether it is the company's main or a sub user. */
export interface LaneInfo {
  lane: string;
  persona: string;
  card: string;
  company: string;
  companyId: string;
  roc: string;
  role: "main" | "sub";
  prefix: string;
  ready: boolean;
}

let cache: LaneInfo[] | undefined;

/**
 * The roster file: LANES_FILE, else env/lanes.local.json (one QA's own accounts, gitignored), else env/lanes.json
 * (Azfar's lanes, the committed roster). Same rule in scripts/lib/lane-broker.mjs.
 */
export function rosterFile(): string {
  if (process.env.LANES_FILE) return path.resolve(process.env.LANES_FILE);
  const local = path.join(__dirname, "..", "env", "lanes.local.json");
  return fs.existsSync(local) ? local : path.join(__dirname, "..", "env", "lanes.json");
}

/** The lane roster (`rosterFile()`), read once per process. */
export function laneRoster(): LaneInfo[] {
  if (!cache) {
    const raw = JSON.parse(fs.readFileSync(rosterFile(), "utf8")) as { lanes: Record<string, Omit<LaneInfo, "lane">> };
    cache = Object.entries(raw.lanes).map(([lane, l]) => ({ lane, ...l }));
  }
  return cache;
}

export const laneInfo = (lane: string): LaneInfo | undefined => laneRoster().find((l) => l.lane === lane);
export const laneOfPersona = (persona: string): LaneInfo | undefined => laneRoster().find((l) => l.persona === persona);

/** The lanes this run holds: LANES ("1,2", set by cr-run / the broker for a multi-lane run) or LANE. */
export function heldLanes(): string[] {
  return (process.env.LANES || process.env.LANE || "1").split(",").map((s) => s.trim()).filter(Boolean);
}

/** The run's own lane (LANE, default 1). */
export const ownLane = (): LaneInfo => {
  const lane = process.env.LANE || "1";
  const info = laneInfo(lane);
  if (!info) throw new Error(`LANE="${lane}" is not a lane. env/lanes.json lists ${laneRoster().map((l) => l.lane).join(", ")}.`);
  return info;
};

/**
 * UCD B for a UCD to UCD run: the first other lane this run holds whose user is of a DIFFERENT company than the
 * run's own lane. A run that holds only its own lane gets lane 2's dealer (faizuddin2) as before, and the login
 * guard then borrows lane 2 or stops with "lane 2 busy".
 */
export function partnerLane(): LaneInfo {
  const own = ownLane();
  const other = heldLanes().map(laneInfo).find((l) => l && l.lane !== own.lane && l.company !== own.company);
  if (other) return other;
  const fallback = own.lane === "2" ? laneInfo("1")! : laneInfo("2")!;
  return fallback;
}

/**
 * The sub user for a main + sub run: a lane this run holds whose user is a SUB of the run's own company.
 * Throws when the run holds none (start it with `--need main+sub`).
 */
export function subLane(): LaneInfo {
  const own = ownLane();
  const sub = heldLanes().map(laneInfo).find((l) => l && l.role === "sub" && l.company === own.company && l.lane !== own.lane);
  if (!sub) throw new Error(`This run holds no sub user of ${own.company} (lanes ${heldLanes().join(",")}). Run it with --need main+sub.`);
  return sub;
}
