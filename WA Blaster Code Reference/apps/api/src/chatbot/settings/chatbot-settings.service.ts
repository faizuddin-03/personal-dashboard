import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SettingValue = boolean | number | string;

/** A single setting row with its value coerced back to its real JS type. */
export interface ChatbotSettingView {
  key: string;
  value: SettingValue;
  valueType: string;
  description: string | null;
  updatedAt: Date;
}

const TTL_MS = 60_000;

/**
 * Typed, cached access to the `chatbot_settings` table. Every setting is stored as a string
 * plus a `valueType` discriminator; this service coerces back to the real JS type on read and
 * infers the discriminator from the JS type on write.
 *
 * The whole table is small and read on nearly every inbound message, so it is cached in full
 * with a 60s TTL. `patch()` invalidates the cache immediately so an operator's change takes
 * effect on the next decision; `reload()` forces a refresh on demand.
 */
@Injectable()
export class ChatbotSettingsService {
  private cache: Map<string, SettingValue> | null = null;
  private cacheLoadedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  async get<T extends SettingValue>(key: string, defaultValue: T): Promise<T> {
    const cache = await this.ensureCache();
    return cache.has(key) ? (cache.get(key) as T) : defaultValue;
  }

  /** Every setting as a coerced row — backs the admin settings screen. Bypasses the cache. */
  async getAll(): Promise<ChatbotSettingView[]> {
    const rows = await this.prisma.chatbotSetting.findMany({ orderBy: { key: 'asc' } });
    return rows.map((row) => ({
      key: row.key,
      value: this.coerce(row.value, row.valueType),
      valueType: row.valueType,
      description: row.description ?? null,
      updatedAt: row.updatedAt,
    }));
  }

  async patch(key: string, value: SettingValue): Promise<void> {
    const valueType = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
    const serialized = String(value);
    await this.prisma.chatbotSetting.upsert({
      where: { key },
      update: { value: serialized, valueType },
      create: { key, value: serialized, valueType },
    });
    this.invalidate();
  }

  async reload(): Promise<void> {
    await this.load();
  }

  private invalidate(): void {
    this.cache = null;
    this.cacheLoadedAt = 0;
  }

  private async ensureCache(): Promise<Map<string, SettingValue>> {
    if (!this.cache || Date.now() - this.cacheLoadedAt >= TTL_MS) {
      await this.load();
    }
    return this.cache as Map<string, SettingValue>;
  }

  private async load(): Promise<void> {
    const rows = await this.prisma.chatbotSetting.findMany();
    const next = new Map<string, SettingValue>();
    for (const row of rows) {
      next.set(row.key, this.coerce(row.value, row.valueType));
    }
    this.cache = next;
    this.cacheLoadedAt = Date.now();
  }

  private coerce(value: string, valueType: string): SettingValue {
    switch (valueType) {
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      case 'number':
        return Number(value);
      default:
        return value;
    }
  }
}
