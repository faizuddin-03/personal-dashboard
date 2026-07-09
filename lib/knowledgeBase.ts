// ── QA Knowledge Base ───────────────────────────────────────
// Durable, user-approved facts about the systems under test (portals,
// modules, business rules, environment quirks), accumulated from completed
// tickets. Fed into every future study and test-plan draft so they get more
// accurate over time. NOTHING enters this store without explicit user
// approval — the AI only suggests entries; the user picks what to keep.
// Stored in localStorage "qa_flow_knowledge".

export interface KnowledgeEntry {
  id: string;
  /** Portal/module this fact belongs to, e.g. "eAuto Insurance", "Secarang". */
  area: string;
  fact: string;
  /** Ticket the fact was learned from (empty for manual entries). */
  source?: string;
  addedAt: string;
}

const KEY = "qa_flow_knowledge";
const MAX_CONTEXT_CHARS = 15_000;

export function getKnowledge(): KnowledgeEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function saveKnowledge(entries: KnowledgeEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function addKnowledgeEntries(items: { area: string; fact: string; source?: string }[]): KnowledgeEntry[] {
  const now = new Date().toISOString();
  const next = [
    ...getKnowledge(),
    ...items.map(i => ({ id: crypto.randomUUID(), area: i.area.trim() || "General", fact: i.fact.trim(), source: i.source, addedAt: now })),
  ];
  saveKnowledge(next);
  return next;
}

export function removeKnowledgeEntry(id: string): KnowledgeEntry[] {
  const next = getKnowledge().filter(e => e.id !== id);
  saveKnowledge(next);
  return next;
}

export function updateKnowledgeEntry(id: string, patch: Partial<Pick<KnowledgeEntry, "area" | "fact">>): KnowledgeEntry[] {
  const next = getKnowledge().map(e => e.id === id ? { ...e, ...patch } : e);
  saveKnowledge(next);
  return next;
}

/**
 * Formats the knowledge base for AI prompts, grouped by area, newest first,
 * capped so a large KB never crowds out the actual ticket content.
 * Returns undefined when there's nothing to send.
 */
export function buildKnowledgeContext(): string | undefined {
  const entries = getKnowledge();
  if (!entries.length) return undefined;

  const byArea = new Map<string, KnowledgeEntry[]>();
  for (const e of [...entries].reverse()) { // newest first
    const list = byArea.get(e.area) ?? [];
    list.push(e);
    byArea.set(e.area, list);
  }

  const lines: string[] = [];
  let used = 0;
  for (const [area, list] of byArea) {
    const header = `[${area}]`;
    if (used + header.length > MAX_CONTEXT_CHARS) break;
    lines.push(header);
    used += header.length;
    for (const e of list) {
      const line = `- ${e.fact}${e.source ? ` (learned from ${e.source})` : ""}`;
      if (used + line.length > MAX_CONTEXT_CHARS) break;
      lines.push(line);
      used += line.length;
    }
  }
  return lines.join("\n");
}
