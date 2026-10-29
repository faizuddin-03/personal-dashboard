import { api } from './client';
import type { LanguagePreference } from './contacts';

export type MalaysianState =
  | 'JOHOR' | 'KEDAH' | 'KELANTAN' | 'MELAKA' | 'NEGERI_SEMBILAN' | 'PAHANG'
  | 'PENANG' | 'PERAK' | 'PERLIS' | 'SABAH' | 'SARAWAK' | 'SELANGOR'
  | 'TERENGGANU' | 'KUALA_LUMPUR' | 'LABUAN' | 'PUTRAJAYA';

export interface StateMappingRow {
  state: MalaysianState;
  languages: LanguagePreference[];
}

export async function listStateLanguageMappings(): Promise<StateMappingRow[]> {
  const { data } = await api.get<StateMappingRow[]>('/state-language-mappings');
  return data;
}

export async function upsertStateLanguageMapping(state: MalaysianState, languages: LanguagePreference[]): Promise<StateMappingRow[]> {
  const { data } = await api.put<StateMappingRow[]>(`/state-language-mappings/${state}`, { languages });
  return data;
}

export async function clearStateLanguageMapping(state: MalaysianState): Promise<StateMappingRow[]> {
  const { data } = await api.delete<StateMappingRow[]>(`/state-language-mappings/${state}`);
  return data;
}

const STATE_LABELS: Record<MalaysianState, string> = {
  JOHOR: 'Johor', KEDAH: 'Kedah', KELANTAN: 'Kelantan', MELAKA: 'Melaka',
  NEGERI_SEMBILAN: 'Negeri Sembilan', PAHANG: 'Pahang', PENANG: 'Penang',
  PERAK: 'Perak', PERLIS: 'Perlis', SABAH: 'Sabah', SARAWAK: 'Sarawak',
  SELANGOR: 'Selangor', TERENGGANU: 'Terengganu', KUALA_LUMPUR: 'Kuala Lumpur',
  LABUAN: 'Labuan', PUTRAJAYA: 'Putrajaya',
};

export const ALL_STATES = Object.keys(STATE_LABELS) as MalaysianState[];

export function stateLabel(s: MalaysianState): string { return STATE_LABELS[s]; }
