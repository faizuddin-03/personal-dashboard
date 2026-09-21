import { Injectable } from '@nestjs/common';
import { parse } from 'papaparse';
import {
  Ethnicity,
  Gender,
  LanguagePreference,
  Occupation,
  OptInStatus,
  Prisma,
  Religion,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizePhoneE164, classifyNumberType } from './phone.util';
import { normalizeState } from './state-normalizer';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportRowError[];
  /** Rows imported whose non-empty state value couldn't be normalized to a known state. */
  unrecognizedStates: number;
}

interface RawRow {
  phone?: string;
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  ethnicity?: string;
  religion?: string;
  occupation?: string;
  languagePreference?: string;
  city?: string;
  state?: string;
}

function parseEnum<T extends string>(
  value: string | undefined,
  enumObj: Record<string, T>,
  field: string,
): T | undefined {
  if (value === undefined || value === '') return undefined;
  const upper = value.toUpperCase();
  if (upper in enumObj) return enumObj[upper];
  throw new Error(`invalid ${field}: ${value}`);
}

@Injectable()
export class CsvImportService {
  constructor(private readonly prisma: PrismaService) {}

  async import(file: Buffer, source: string, actorUserId: string): Promise<ImportResult> {
    const text = file.toString('utf8');
    const parsed = parse<RawRow>(text, { header: true, skipEmptyLines: true });

    const result: ImportResult = { imported: 0, skipped: 0, errors: [], unrecognizedStates: 0 };

    for (let i = 0; i < parsed.data.length; i++) {
      const rowNumber = i + 2; // +1 for header, +1 to be 1-indexed
      const row = parsed.data[i];

      try {
        if (!row.phone || row.phone.trim() === '') {
          throw new Error('missing required column: phone');
        }
        const phoneE164 = normalizePhoneE164(row.phone);

        const existing = await this.prisma.contact.findUnique({ where: { phoneE164 } });
        if (existing) {
          result.skipped++;
          continue;
        }

        const normalizedState = normalizeState(row.state) ?? undefined;
        // A non-empty raw state that didn't resolve to a known enum value is imported
        // without a state — surface the count so the caller can warn the operator.
        const hadRawState = !!row.state && row.state.trim() !== '';
        if (hadRawState && normalizedState === undefined) {
          result.unrecognizedStates++;
        }

        // WhatsApp only delivers to mobiles, so opt-in follows the number type: mobiles (PHONE)
        // are opted in; fixed-line/fax (LANE) are opted out (they're filtered out of blasts anyway).
        const numberType = classifyNumberType(phoneE164);
        const isMobile = numberType === 'PHONE';
        const now = new Date();

        const data: Prisma.ContactCreateInput = {
          phoneE164,
          name: row.name?.trim() || undefined,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          gender: parseEnum(row.gender, Gender as unknown as Record<string, Gender>, 'gender'),
          ethnicity: parseEnum(row.ethnicity, Ethnicity as unknown as Record<string, Ethnicity>, 'ethnicity'),
          religion: parseEnum(row.religion, Religion as unknown as Record<string, Religion>, 'religion'),
          occupation: parseEnum(row.occupation, Occupation as unknown as Record<string, Occupation>, 'occupation'),
          languagePreference: parseEnum(
            row.languagePreference,
            LanguagePreference as unknown as Record<string, LanguagePreference>,
            'languagePreference',
          ),
          city: row.city?.trim() || undefined,
          state: normalizedState,
          attributes: {},
          numberType,
          optInStatus: isMobile ? OptInStatus.OPTED_IN : OptInStatus.OPTED_OUT,
          optInSource: source,
          optInAt: isMobile ? now : undefined,
          optOutAt: isMobile ? undefined : now,
        };

        await this.prisma.contact.create({ data });
        result.imported++;
      } catch (err) {
        result.errors.push({
          row: rowNumber,
          message: err instanceof Error ? err.message : 'unknown error',
        });
      }
    }

    return result;
  }
}
