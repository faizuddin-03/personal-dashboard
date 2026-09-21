import { MalaysianState } from '@prisma/client';

// Canonical + alias lookup. Keys are normalized (lowercased, punctuation/space-collapsed).
const ALIASES: Record<string, MalaysianState> = {
  'johor': 'JOHOR',
  'kedah': 'KEDAH',
  'kelantan': 'KELANTAN',
  'melaka': 'MELAKA',
  'malacca': 'MELAKA',
  'negeri sembilan': 'NEGERI_SEMBILAN',
  'negeri_sembilan': 'NEGERI_SEMBILAN',
  'n sembilan': 'NEGERI_SEMBILAN',
  'pahang': 'PAHANG',
  'penang': 'PENANG',
  'pulau pinang': 'PENANG',
  'png': 'PENANG',
  'perak': 'PERAK',
  'perlis': 'PERLIS',
  'sabah': 'SABAH',
  'sarawak': 'SARAWAK',
  'selangor': 'SELANGOR',
  'terengganu': 'TERENGGANU',
  'kuala lumpur': 'KUALA_LUMPUR',
  'kuala_lumpur': 'KUALA_LUMPUR',
  'kl': 'KUALA_LUMPUR',
  'wp kuala lumpur': 'KUALA_LUMPUR',
  'w p kuala lumpur': 'KUALA_LUMPUR',
  'wilayah persekutuan kuala lumpur': 'KUALA_LUMPUR',
  'labuan': 'LABUAN',
  'wp labuan': 'LABUAN',
  'putrajaya': 'PUTRAJAYA',
  'wp putrajaya': 'PUTRAJAYA',
};

/** Collapse to a comparable key: lowercase, strip dots, collapse whitespace. */
function keyOf(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize a free-text state string to a MalaysianState enum value, or null if unrecognized. */
export function normalizeState(raw: string | null | undefined): MalaysianState | null {
  if (!raw) return null;
  const key = keyOf(raw);
  if (!key) return null;
  return ALIASES[key] ?? null;
}
