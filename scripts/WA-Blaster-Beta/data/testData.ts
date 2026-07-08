import path from 'path';

// ── Test data ───────────────────────────────────────────────
// Every non-credential string a test needs, grouped per area.
// All env-switchable; fallbacks match the seeded staging data.

export const API_BASE = process.env.API_BASE ?? 'http://localhost:3000';

export const CAMPAIGNS = {
  seedTemplate:    process.env.E2E_SEED_TEMPLATE     ?? 'sample_promo_2026',
  audienceState:   process.env.E2E_AUDIENCE_STATE    ?? 'Selangor',
  blastNamePrefix: process.env.E2E_BLAST_NAME_PREFIX ?? 'BETA',
};

export const INBOX = {
  phonePrefix:      process.env.E2E_INBOX_PHONE_PREFIX ?? '+6011110040',
  cannedReplyTitle: process.env.E2E_CANNED_REPLY_TITLE ?? 'BETA Saved Reply',
  cannedReplyBody:  process.env.E2E_CANNED_REPLY_BODY  ?? 'This is a BETA canned reply.',
};

export const CONTACTS = {
  dealerTier:        process.env.E2E_DEALER_TIER          ?? 'GOLD',
  dealerSpec:        process.env.E2E_DEALER_SPEC          ?? 'EV_HYBRID',
  dealerNamePrefix:  process.env.E2E_DEALER_NAME_PREFIX   ?? 'BETA Dealer',
  dealerPhonePrefix: process.env.E2E_DEALER_PHONE_PREFIX  ?? '+6013',
  searchTerm:        process.env.E2E_CONTACTS_SEARCH_TERM ?? 'Auto Bestari',
  contactNamePrefix: process.env.E2E_CONTACT_NAME_PREFIX  ?? 'Automation Test',
  contactState:      process.env.E2E_CONTACT_STATE        ?? 'SELANGOR',
  validCsv:   path.join(__dirname, 'valid-contacts.csv'),
  invalidCsv: path.join(__dirname, 'invalid-contacts.csv'),
};

export const SEGMENTS = {
  namePrefix: process.env.E2E_SEGMENT_NAME_PREFIX ?? 'BETA Seg',
};

export const TEMPLATES = {
  category:    process.env.E2E_TEMPLATE_CATEGORY     ?? 'MARKETING',
  langVariant: process.env.E2E_TEMPLATE_LANG_VARIANT ?? 'MS',
  namePrefix:  process.env.E2E_TEMPLATE_NAME_PREFIX  ?? 'beta_tpl',
  bodyEn:      process.env.E2E_TEMPLATE_BODY_EN      ?? 'Hello {{1}}!',
  bodyMs:      process.env.E2E_TEMPLATE_BODY_MS      ?? 'Salam {{1}}!',
  wizardBrief: process.env.E2E_WIZARD_BRIEF          ?? 'Service reminder for BETA testing',
};

export const SETTINGS = {
  inviteEmailPrefix: process.env.E2E_INVITE_EMAIL_PREFIX ?? 'beta.invite',
  inviteNamePrefix:  process.env.E2E_INVITE_NAME_PREFIX  ?? 'BETA User',
  mappingState1:     process.env.E2E_MAPPING_STATE_1     ?? 'PENANG',
  mappingLang1a:     process.env.E2E_MAPPING_LANG_1_1    ?? 'ZH',
  mappingLang1b:     process.env.E2E_MAPPING_LANG_1_2    ?? 'EN',
  mappingState2:     process.env.E2E_MAPPING_STATE_2     ?? 'KELANTAN',
  mappingLang2:      process.env.E2E_MAPPING_LANG_2      ?? 'MS',
};

export const KNOWLEDGE_BASE = {
  phonePrefix: process.env.E2E_KB_PHONE_PREFIX ?? '+6011120040',
};

/** yyyy-MM-ddTHH:mm local string, N minutes from now (for schedule inputs). */
export function futureDateTime(minutesFromNow: number): string {
  const d   = new Date(Date.now() + minutesFromNow * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Same format, N minutes in the past (for validation tests). */
export function pastDateTime(minutesAgo: number): string {
  return futureDateTime(-minutesAgo);
}
