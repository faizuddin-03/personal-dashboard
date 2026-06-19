import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotSettingsService } from './chatbot-settings.service';

interface Row {
  key: string;
  value: string;
  valueType: string;
}

/**
 * In-memory stand-in for `prisma.chatbotSetting`. `findMany` returns a snapshot of the
 * store and `upsert` mutates it the way Postgres would, so the cache/coercion logic can
 * be exercised without a database.
 */
function makePrisma(initial: Row[] = []) {
  const store: Row[] = initial.map((r) => ({ ...r }));
  const findMany = jest.fn(async () => store.map((r) => ({ ...r })));
  const upsert = jest.fn(
    async ({
      where,
      create,
      update,
    }: {
      where: { key: string };
      create: Row;
      update: Partial<Row>;
    }) => {
      const existing = store.find((r) => r.key === where.key);
      if (existing) Object.assign(existing, update);
      else store.push({ ...create });
      return existing ?? create;
    },
  );
  const prisma = { chatbotSetting: { findMany, upsert } } as unknown as PrismaService;
  return { prisma, store, findMany, upsert };
}

describe('ChatbotSettingsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('type coercion', () => {
    it('coerces a boolean-typed value to a real boolean', async () => {
      const { prisma } = makePrisma([
        { key: 'enabled', value: 'true', valueType: 'boolean' },
        { key: 'disable_auto_reply', value: 'false', valueType: 'boolean' },
      ]);
      const svc = new ChatbotSettingsService(prisma);

      expect(await svc.get('enabled', false)).toBe(true);
      expect(await svc.get('disable_auto_reply', true)).toBe(false);
    });

    it('coerces a number-typed value to a real number', async () => {
      const { prisma } = makePrisma([{ key: 'confidence_threshold', value: '0.85', valueType: 'number' }]);
      const svc = new ChatbotSettingsService(prisma);

      const v = await svc.get('confidence_threshold', 0.5);
      expect(v).toBe(0.85);
      expect(typeof v).toBe('number');
    });

    it('returns a string-typed value unchanged', async () => {
      const { prisma } = makePrisma([
        { key: 'business_hours_timezone', value: 'Asia/Kuala_Lumpur', valueType: 'string' },
      ]);
      const svc = new ChatbotSettingsService(prisma);

      expect(await svc.get('business_hours_timezone', 'UTC')).toBe('Asia/Kuala_Lumpur');
    });
  });

  describe('missing key', () => {
    it('returns the supplied default when the key is absent', async () => {
      const { prisma } = makePrisma([]);
      const svc = new ChatbotSettingsService(prisma);

      expect(await svc.get('enabled', false)).toBe(false);
      expect(await svc.get('confidence_threshold', 0.85)).toBe(0.85);
      expect(await svc.get('business_days', 'MON,TUE')).toBe('MON,TUE');
    });
  });

  describe('caching', () => {
    it('serves repeated reads from cache (single DB query within the TTL)', async () => {
      const { prisma, findMany } = makePrisma([{ key: 'enabled', value: 'true', valueType: 'boolean' }]);
      const svc = new ChatbotSettingsService(prisma);

      await svc.get('enabled', false);
      await svc.get('enabled', false);
      await svc.get('confidence_threshold', 0.85);

      expect(findMany).toHaveBeenCalledTimes(1);
    });

    it('reloads from the DB once the 60s TTL has elapsed', async () => {
      const { prisma, findMany } = makePrisma([{ key: 'enabled', value: 'true', valueType: 'boolean' }]);
      const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
      const svc = new ChatbotSettingsService(prisma);

      await svc.get('enabled', false);
      expect(findMany).toHaveBeenCalledTimes(1);

      now.mockReturnValue(1_000_000 + 59_000); // still inside the 60s window
      await svc.get('enabled', false);
      expect(findMany).toHaveBeenCalledTimes(1);

      now.mockReturnValue(1_000_000 + 61_000); // TTL expired
      await svc.get('enabled', false);
      expect(findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('patch', () => {
    it('persists the new value with a valueType inferred from the JS type', async () => {
      const { prisma, upsert } = makePrisma([]);
      const svc = new ChatbotSettingsService(prisma);

      await svc.patch('enabled', true);
      await svc.patch('confidence_threshold', 0.9);
      await svc.patch('business_hours_timezone', 'Asia/Kuala_Lumpur');

      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'enabled' },
          create: expect.objectContaining({ key: 'enabled', value: 'true', valueType: 'boolean' }),
          update: expect.objectContaining({ value: 'true', valueType: 'boolean' }),
        }),
      );
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ key: 'confidence_threshold', value: '0.9', valueType: 'number' }),
        }),
      );
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ value: 'Asia/Kuala_Lumpur', valueType: 'string' }),
        }),
      );
    });

    it('invalidates the cache so the next get reflects the patched value', async () => {
      const { prisma, findMany } = makePrisma([{ key: 'enabled', value: 'false', valueType: 'boolean' }]);
      const svc = new ChatbotSettingsService(prisma);

      expect(await svc.get('enabled', false)).toBe(false);
      expect(findMany).toHaveBeenCalledTimes(1);

      await svc.patch('enabled', true);

      expect(await svc.get('enabled', false)).toBe(true);
      expect(findMany).toHaveBeenCalledTimes(2); // cache was invalidated, forcing a reload
    });
  });

  describe('reload', () => {
    it('drops the cache and re-reads on the next access', async () => {
      const { prisma, store, findMany } = makePrisma([{ key: 'enabled', value: 'false', valueType: 'boolean' }]);
      const svc = new ChatbotSettingsService(prisma);

      expect(await svc.get('enabled', false)).toBe(false);

      // Mutate the underlying store out-of-band (as if another instance patched it).
      store[0].value = 'true';
      await svc.reload();

      expect(await svc.get('enabled', false)).toBe(true);
      expect(findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAll', () => {
    it('returns every setting with its coerced value and value type', async () => {
      const { prisma } = makePrisma([
        { key: 'enabled', value: 'true', valueType: 'boolean' },
        { key: 'confidence_threshold', value: '0.85', valueType: 'number' },
        { key: 'business_name', value: 'Acme', valueType: 'string' },
      ]);
      const svc = new ChatbotSettingsService(prisma);

      const all = await svc.getAll();

      expect(all).toHaveLength(3);
      expect(all).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'enabled', value: true, valueType: 'boolean' }),
          expect.objectContaining({ key: 'confidence_threshold', value: 0.85, valueType: 'number' }),
          expect.objectContaining({ key: 'business_name', value: 'Acme', valueType: 'string' }),
        ]),
      );
    });
  });
});
