import { TemplateStatus, TemplateCategory, LanguagePreference } from '@prisma/client';
import type { MetaComponent } from '../whatsapp/whatsapp-cloud-api.service';

const LOCALE_TO_LANG: Record<string, LanguagePreference> = {
  en: 'EN', en_us: 'EN', en_gb: 'EN',
  ms: 'MS',
  zh: 'ZH', zh_cn: 'ZH', zh_hk: 'ZH', zh_tw: 'ZH',
  ta: 'TA',
};

/** Reverse of templates.service `toMetaLocale`. Unknown/empty → OTHER. */
export function fromMetaLocale(locale: string): LanguagePreference {
  return LOCALE_TO_LANG[String(locale ?? '').trim().toLowerCase()] ?? 'OTHER';
}

const STATUS_MAP: Record<string, TemplateStatus> = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  IN_APPEAL: 'PENDING',
  REJECTED: 'REJECTED',
  PAUSED: 'DISABLED',
  DISABLED: 'DISABLED',
  FLAGGED: 'DISABLED',
  LIMIT_EXCEEDED: 'DISABLED',
  PENDING_DELETION: 'DISABLED',
  DELETED: 'DISABLED',
};

/** Map a Meta status to the local enum; null means "unknown → skip this template". */
export function fromMetaStatus(status: string): TemplateStatus | null {
  return STATUS_MAP[String(status ?? '').trim().toUpperCase()] ?? null;
}

const CATEGORIES: TemplateCategory[] = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];

/** Pass through a known Meta category; default unknown to UTILITY (matches coerceCategory). */
export function fromMetaCategory(category: string): TemplateCategory {
  const up = String(category ?? '').trim().toUpperCase() as TemplateCategory;
  return CATEGORIES.includes(up) ? up : 'UTILITY';
}

export interface ParsedMetaContent {
  bodyText: string;
  headerJson: { type: 'TEXT'; text: string } | null;
  footerText: string | null;
  buttonsJson: Array<{ type: string; text: string; url?: string; phoneNumber?: string }> | null;
  variables: string[];
}

/** Count distinct {{n}} placeholders in a body string. */
function countPlaceholders(body: string): number {
  const nums = new Set<string>();
  for (const m of body.matchAll(/\{\{(\d+)\}\}/g)) nums.add(m[1]);
  return nums.size;
}

/**
 * Convert Meta's components[] back into our column shape.
 * Variable NAMES cannot be recovered from Meta (it stores only positional example
 * values), so `variables` is the example body_text row when present, otherwise an
 * array of empty strings sized to the placeholder count.
 */
export function parseMetaComponents(components: MetaComponent[]): ParsedMetaContent {
  let bodyText = '';
  let headerJson: ParsedMetaContent['headerJson'] = null;
  let footerText: string | null = null;
  let buttonsJson: ParsedMetaContent['buttonsJson'] = null;
  let variables: string[] = [];

  for (const c of components ?? []) {
    switch (c.type) {
      case 'BODY':
        bodyText = c.text ?? '';
        if (Array.isArray(c.example?.body_text) && Array.isArray(c.example?.body_text?.[0])) {
          variables = c.example!.body_text![0].map((v) => String(v));
        }
        break;
      case 'HEADER':
        if (c.format === 'TEXT' && c.text) headerJson = { type: 'TEXT', text: c.text };
        break;
      case 'FOOTER':
        footerText = c.text ?? null;
        break;
      case 'BUTTONS':
        if (c.buttons?.length) {
          buttonsJson = c.buttons.map((b) => ({
            type: b.type,
            text: b.text,
            ...(b.url ? { url: b.url } : {}),
            ...(b.phone_number ? { phoneNumber: b.phone_number } : {}),
          }));
        }
        break;
    }
  }

  if (variables.length === 0) {
    const count = countPlaceholders(bodyText);
    if (count > 0) variables = Array.from({ length: count }, () => '');
  }
  return { bodyText, headerJson, footerText, buttonsJson, variables };
}
