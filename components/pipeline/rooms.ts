// Which station (stage room) a character works in for a ticket, and which
// stage column a ticket shows in (Faizuddin, 2026-10-27). Used by the big room
// (bigRoomEngine.ts) and the stage list. The old per-stage room state
// (computeRooms) was removed on 2026-10-28 with the per-stage scenes.
import { ACTIVE_JOB } from "@/components/pipeline/api";
import {
  PIPELINE_STAGES,
  type Character, type JobAction, type PipelineJob, type PipelineStage, type PipelineTicket,
} from "@/lib/pipeline/types";

export const ROOM_OWNER: Record<PipelineStage, Character | null> = {
  studied: "scout",
  related: "scribe",
  scenarios: "elf",
  approved: "elf",
  automation: "dwarf",
  testing: "elf",
  findings: "elf",
  raised: "scout",
  done: null,
};

const STAGE_INDEX = Object.fromEntries(PIPELINE_STAGES.map((s, i) => [s.id, i])) as Record<PipelineStage, number>;

const ACTION_ROOM: Partial<Record<JobAction, PipelineStage>> = {
  "scribe:related": "related",
  "elf:plan": "scenarios",
  "elf:build": "approved",
  "dwarf:build": "automation",
  "dwarf:chat": "automation",
  "dwarf:sync": "automation",
  "elf:findings": "findings",
  "scout:issue": "raised",
  "scribe:chat": "related",
  "scout:chat": "studied",
  "scout:help": "studied",
  "scribe:help": "related",
  "elf:help": "scenarios",
  "dwarf:help": "automation",
};

/** The room where character `c` does its work for a ticket in `stage`. */
export function roomFor(c: Character, stage: PipelineStage, action?: JobAction): PipelineStage {
  // Sage (2026-10-27) keeps the knowledge base from his own archive; he never moves a ticket.
  if (c === "sage") return stage;
  if (action && ACTION_ROOM[action]) return ACTION_ROOM[action]!;
  if (ROOM_OWNER[stage] === c) return stage;
  if (c === "scribe") return "related";
  if (c === "dwarf") return "automation";
  if (c === "scout") return STAGE_INDEX[stage] >= STAGE_INDEX.findings ? "raised" : "studied";
  // Elf: her nearest room at or before the ticket's stage.
  const elfRooms = PIPELINE_STAGES.filter(s => ROOM_OWNER[s.id] === "elf" && STAGE_INDEX[s.id] <= STAGE_INDEX[stage]);
  return elfRooms.length ? elfRooms[elfRooms.length - 1].id : "scenarios";
}

/**
 * The column a ticket card shows in: its saved stage, moved forward to the
 * room of any job running on it now (Faizuddin, 2026-10-27: Scribe was
 * working on EAINT-12019 but the card still sat under Studied). The saved
 * stage only advances when a job finishes; never moves a card backwards.
 */
export function displayStage(t: PipelineTicket, jobs: PipelineJob[]): PipelineStage {
  let stage = t.stage;
  for (const j of jobs) {
    // A help job (one character answering another) never moves the card.
    if (j.key !== t.key || !ACTIVE_JOB(j) || j.action.endsWith(":help") || j.character === "sage") continue;
    const room = roomFor(j.character, t.stage, j.action);
    if (STAGE_INDEX[room] > STAGE_INDEX[stage]) stage = room;
  }
  return stage;
}
