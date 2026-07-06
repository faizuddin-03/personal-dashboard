// ── Test plan style templates ──────────────────────────────
// User-uploaded past test plan/scenario/script documents, kept as extracted
// text so the AI can mimic the user's own format. Global (not per-ticket) —
// replaceable over time. Stored in localStorage "qa_flow_templates".

export interface TestPlanTemplate {
  id: string;
  name: string;
  addedAt: string;
  text: string;
}

const KEY = "qa_flow_templates";

export function getTemplates(): TestPlanTemplate[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function saveTemplates(templates: TestPlanTemplate[]) {
  localStorage.setItem(KEY, JSON.stringify(templates));
}

export function addTemplate(name: string, text: string): TestPlanTemplate[] {
  const next = [...getTemplates(), { id: crypto.randomUUID(), name, addedAt: new Date().toISOString(), text }];
  saveTemplates(next);
  return next;
}

export function removeTemplate(id: string): TestPlanTemplate[] {
  const next = getTemplates().filter(t => t.id !== id);
  saveTemplates(next);
  return next;
}
