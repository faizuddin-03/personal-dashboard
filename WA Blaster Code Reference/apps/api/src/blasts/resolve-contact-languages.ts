import { LanguagePreference, MalaysianState } from '@prisma/client';

export function resolveContactLanguages(
  contactState: MalaysianState | null,
  mapping: Map<MalaysianState, LanguagePreference[]>,
  defaultLanguage: LanguagePreference,
): LanguagePreference[] {
  if (!contactState) return [defaultLanguage];
  const langs = mapping.get(contactState);
  if (!langs || langs.length === 0) return [defaultLanguage];
  return langs;
}

/** Bucket key for contacts with no usable state mapping (null or unmapped state). */
export const UNMAPPED_STATE_KEY = 'UNMAPPED';

export interface PlanContact {
  id: string;
  state: MalaysianState | null;
}

export interface StateLanguagePlan {
  /** One entry per (contact × resolved language) — the messages to send. */
  messageSpecs: { contactId: string; templateId: string }[];
  uniqueContacts: number;
  totalMessages: number;
  byLanguage: Record<string, number>;
  byState: { state: string; contacts: number; languages: string[] }[];
  /** Required languages that have no approved template variant. Empty = good to launch. */
  gaps: { language: string; requiredByStates: string[] }[];
}

/**
 * Single source of truth for state-based fan-out. Both the blast-creation path and
 * the wizard preview call this so their message counts, language breakdown, and gap
 * detection can never diverge. `approvedByLang` maps an approved language to its
 * template row id; a language absent from it is a coverage gap.
 */
export function buildStateLanguagePlan(
  contacts: PlanContact[],
  mapping: Map<MalaysianState, LanguagePreference[]>,
  defaultLanguage: LanguagePreference,
  approvedByLang: Map<string, { id: string }>,
): StateLanguagePlan {
  const messageSpecs: { contactId: string; templateId: string }[] = [];
  const byLanguage: Record<string, number> = {};
  const byStateMap = new Map<string, { contacts: number; languages: Set<string> }>();
  const gapStates = new Map<string, Set<string>>();

  for (const c of contacts) {
    const langs = resolveContactLanguages(c.state, mapping, defaultLanguage);
    const stateKey = c.state ?? UNMAPPED_STATE_KEY;
    if (!byStateMap.has(stateKey)) byStateMap.set(stateKey, { contacts: 0, languages: new Set() });
    const entry = byStateMap.get(stateKey)!;
    entry.contacts += 1;
    for (const lang of langs) {
      entry.languages.add(lang);
      byLanguage[lang] = (byLanguage[lang] ?? 0) + 1;
      const approved = approvedByLang.get(lang);
      if (approved) {
        messageSpecs.push({ contactId: c.id, templateId: approved.id });
      } else {
        if (!gapStates.has(lang)) gapStates.set(lang, new Set());
        gapStates.get(lang)!.add(stateKey);
      }
    }
  }

  return {
    messageSpecs,
    uniqueContacts: contacts.length,
    totalMessages: Object.values(byLanguage).reduce((a, b) => a + b, 0),
    byLanguage,
    byState: [...byStateMap.entries()].map(([state, v]) => ({
      state,
      contacts: v.contacts,
      languages: [...v.languages],
    })),
    gaps: [...gapStates.entries()].map(([language, states]) => ({
      language,
      requiredByStates: [...states],
    })),
  };
}
