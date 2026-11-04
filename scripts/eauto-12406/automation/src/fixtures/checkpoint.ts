import * as fs from "node:fs";
import * as path from "node:path";

/**
 * A build's memory — one JSON file per onboarding record, written after every
 * phase, so a build that dies at step nine resumes at step nine.
 *
 * Why this is worth a file: a fresh chain costs a human reCAPTCHA tick and an
 * RM108 payment before it has produced anything, and the tick cannot be saved
 * and replayed — it is enforced per build. Starting over because phase nine
 * hit a slow page throws both away.
 *
 * Kept under `state/onboarding/`, which is gitignored: a checkpoint holds the
 * dealer's signed Application link, and that link IS the dealer's session.
 */

export const CHECKPOINT_DIR = path.join(__dirname, "..", "..", "state", "onboarding");

export interface PhaseRecord {
  at: string;
  [detail: string]: unknown;
}

export interface Checkpoint<Profile = Record<string, unknown>> {
  label: string;
  createdAt: string;
  updatedAt: string;
  profile: Profile;
  /** Identifiers learned along the way. Each is written the moment it is known. */
  preAppNo?: string;
  dealerLink?: string;
  applicationNo?: string;
  uuid?: string;
  phases: Record<string, PhaseRecord>;
}

const fileFor = (label: string) => path.join(CHECKPOINT_DIR, `${label}.json`);

/** `onb-260923-1412` — sortable, and readable in a listing. */
export function newLabel(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `onb-${String(now.getFullYear()).slice(2)}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

export function readCheckpoint<P>(label: string): Checkpoint<P> {
  const file = fileFor(label);
  if (!fs.existsSync(file)) {
    const known = listCheckpoints().slice(0, 8).join(", ") || "(none)";
    throw new Error(`No checkpoint "${label}". Newest: ${known}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as Checkpoint<P>;
}

/** Merge and save. Called after EVERY phase and whenever an identifier is learned. */
export function saveCheckpoint<P>(cp: Checkpoint<P>): Checkpoint<P> {
  fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  cp.updatedAt = new Date().toISOString();
  fs.writeFileSync(fileFor(cp.label), JSON.stringify(cp, null, 2));
  return cp;
}

/** Labels, newest first. */
export function listCheckpoints(): string[] {
  if (!fs.existsSync(CHECKPOINT_DIR)) return [];
  return fs
    .readdirSync(CHECKPOINT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort()
    .reverse();
}
