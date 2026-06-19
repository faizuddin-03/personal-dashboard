import { TemplatesService } from '../templates.service';
import { LlmService } from '../../llm/llm.service';
import { TemplateDraft } from '../../llm/llm.types';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('TemplatesService.nextVersionFor', () => {
  let service: TemplatesService;
  let prisma: { template: { findFirst: jest.Mock; findMany: jest.Mock } };

  beforeEach(() => {
    prisma = {
      template: { findFirst: jest.fn(), findMany: jest.fn() },
    };
    service = new TemplatesService(prisma as any, {} as any, {} as any);
  });

  it('returns 1 for a name with no existing rows', async () => {
    prisma.template.findMany.mockResolvedValue([]);
    expect(await service.nextVersionFor('raya_promo_2026')).toBe(1);
  });

  it('returns max(version)+1 when all existing rows are REJECTED or DISABLED', async () => {
    prisma.template.findMany.mockResolvedValue([
      { version: 1, status: 'REJECTED' },
      { version: 2, status: 'REJECTED' },
    ]);
    expect(await service.nextVersionFor('raya_promo_2026')).toBe(3);
  });

  it('throws ConflictException when an active row exists (DRAFT/PENDING/APPROVED)', async () => {
    prisma.template.findMany.mockResolvedValue([{ version: 1, status: 'APPROVED' }]);
    await expect(service.nextVersionFor('raya_promo_2026')).rejects.toThrow(ConflictException);
  });
});

describe('TemplatesService.generateDrafts', () => {
  const mockDrafts: TemplateDraft[] = [
    {
      language: 'EN',
      name: 'promo_en',
      category: 'MARKETING',
      body: 'Hello {{1}}, check out our offer!',
      variables: ['name'],
      approvalLikelihood: 'HIGH',
      rationale: 'Clear and concise.',
    },
    {
      language: 'MS',
      name: 'promo_ms',
      category: 'MARKETING',
      body: 'Helo {{1}}, lihat tawaran kami!',
      variables: ['name'],
      approvalLikelihood: 'HIGH',
      rationale: 'Terjemahan yang baik.',
    },
  ];

  let service: TemplatesService;
  let llm: { generateTemplateDrafts: jest.Mock };

  beforeEach(() => {
    llm = { generateTemplateDrafts: jest.fn().mockResolvedValue({ relevant: true, drafts: mockDrafts }) };
    service = new TemplatesService({} as any, {} as any, llm as unknown as LlmService);
  });

  it('forwards brief, languages, and tone to llm.generateTemplateDrafts', async () => {
    const dto = { brief: 'Raya promo for sedan buyers', languages: ['EN', 'MS'], tone: 'friendly' as const };
    const result = await service.generateDrafts(dto);

    expect(llm.generateTemplateDrafts).toHaveBeenCalledTimes(1);
    expect(llm.generateTemplateDrafts).toHaveBeenCalledWith({
      brief: dto.brief,
      languages: dto.languages,
      tone: dto.tone,
    });
    expect(result).toEqual(mockDrafts);
  });

  it('returns the drafts array from the LLM', async () => {
    const result = await service.generateDrafts({
      brief: 'Test brief here',
      languages: ['EN'],
      tone: 'formal',
    });
    expect(result).toHaveLength(2);
    expect(result[0].language).toBe('EN');
    expect(result[1].language).toBe('MS');
  });

  it('throws BadRequestException with the refusal reason when the brief is off-topic', async () => {
    llm.generateTemplateDrafts.mockResolvedValue({
      relevant: false,
      refusalReason: 'That is a general question, not a template request.',
      drafts: [],
    });
    await expect(
      service.generateDrafts({ brief: 'where is paris?', languages: ['EN'], tone: 'friendly' }),
    ).rejects.toThrow('That is a general question, not a template request.');
    await expect(
      service.generateDrafts({ brief: 'where is paris?', languages: ['EN'], tone: 'friendly' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException with a default message when relevant but no drafts came back', async () => {
    llm.generateTemplateDrafts.mockResolvedValue({ relevant: true, drafts: [] });
    await expect(
      service.generateDrafts({ brief: 'insurance renewal', languages: ['EN'], tone: 'friendly' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('TemplatesService.syncPending', () => {
  let prisma: any; let whatsapp: any; let service: TemplatesService;
  beforeEach(() => {
    prisma = { template: { findMany: jest.fn(), update: jest.fn().mockResolvedValue({}) } };
    whatsapp = { getTemplateStatus: jest.fn() };
    service = new TemplatesService(prisma, whatsapp, {} as any);
  });

  it('staleOnly adds a submittedAt cutoff; false does not', async () => {
    prisma.template.findMany.mockResolvedValue([]);
    await service.syncPending(true);
    expect(prisma.template.findMany.mock.calls[0][0].where).toEqual(expect.objectContaining({
      status: 'PENDING', metaTemplateId: { not: null }, submittedAt: expect.objectContaining({ lt: expect.any(Date) }),
    }));
    await service.syncPending(false);
    expect(prisma.template.findMany.mock.calls[1][0].where).toEqual({ status: 'PENDING', metaTemplateId: { not: null } });
  });

  it('updates APPROVED/REJECTED, skips PENDING, returns counts', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', metaTemplateId: 'm1', approvedAt: null },
      { id: 't2', metaTemplateId: 'm2', approvedAt: null },
      { id: 't3', metaTemplateId: 'm3', approvedAt: null },
    ]);
    whatsapp.getTemplateStatus
      .mockResolvedValueOnce({ status: 'APPROVED' })
      .mockResolvedValueOnce({ status: 'PENDING' })
      .mockResolvedValueOnce({ status: 'REJECTED' });
    const res = await service.syncPending(false);
    expect(res).toEqual({ checked: 3, updated: 2 });
    expect(prisma.template.update).toHaveBeenCalledTimes(2);
  });

  it('a failing getTemplateStatus does not abort the rest', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', metaTemplateId: 'm1', approvedAt: null },
      { id: 't2', metaTemplateId: 'm2', approvedAt: null },
    ]);
    whatsapp.getTemplateStatus
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ status: 'APPROVED' });
    const res = await service.syncPending(false);
    expect(res).toEqual({ checked: 2, updated: 1 });
  });
});

describe('TemplatesService.updateDraftGroup', () => {
  let prisma: any;
  let service: TemplatesService;

  const draftRows = [
    { id: 't-en', name: 'promo', version: 2, language: 'EN', status: 'DRAFT', bodyText: 'old en' },
    { id: 't-ms', name: 'promo', version: 2, language: 'MS', status: 'DRAFT', bodyText: 'old ms' },
  ];

  beforeEach(() => {
    prisma = {
      template: {
        findMany: jest.fn().mockResolvedValue(draftRows),
        update: jest.fn((a: any) => Promise.resolve({ ...a.where, ...a.data })),
        create: jest.fn((a: any) => Promise.resolve({ id: 'new', ...a.data })),
        delete: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };
    service = new TemplatesService(prisma, {} as any, {} as any);
  });

  it('updates existing-language rows in place (category + body)', async () => {
    await service.updateDraftGroup('promo', {
      category: 'MARKETING',
      variants: [
        { language: 'EN', bodyText: 'new en', variables: [] },
        { language: 'MS', bodyText: 'new ms', variables: [] },
      ],
    } as any, 'u1');

    expect(prisma.template.update).toHaveBeenCalledTimes(2);
    const enCall = prisma.template.update.mock.calls.find((c: any) => c[0].where.id === 't-en')[0];
    expect(enCall.data.bodyText).toBe('new en');
    expect(enCall.data.category).toBe('MARKETING');
    expect(prisma.template.create).not.toHaveBeenCalled();
    expect(prisma.template.delete).not.toHaveBeenCalled();
  });

  it('creates rows for added languages and deletes removed ones, keeping the version', async () => {
    await service.updateDraftGroup('promo', {
      category: 'UTILITY',
      variants: [
        { language: 'EN', bodyText: 'kept', variables: [] },
        { language: 'ZH', bodyText: 'added', variables: [] },
      ],
    } as any, 'u1');

    expect(prisma.template.create).toHaveBeenCalledTimes(1);
    const created = prisma.template.create.mock.calls[0][0].data;
    expect(created.language).toBe('ZH');
    expect(created.version).toBe(2);
    expect(created.status).toBe('DRAFT');
    expect(created.createdById).toBe('u1');
    expect(prisma.template.delete).toHaveBeenCalledWith({ where: { id: 't-ms' } });
  });

  it('throws ConflictException when any row in the group is not DRAFT', async () => {
    prisma.template.findMany.mockResolvedValue([
      { ...draftRows[0], status: 'PENDING' },
      draftRows[1],
    ]);
    await expect(
      service.updateDraftGroup('promo', { category: 'UTILITY', variants: [{ language: 'EN', bodyText: 'x', variables: [] }] } as any, 'u1'),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFoundException when no rows exist for the name', async () => {
    prisma.template.findMany.mockResolvedValue([]);
    await expect(
      service.updateDraftGroup('ghost', { category: 'UTILITY', variants: [{ language: 'EN', bodyText: 'x', variables: [] }] } as any, 'u1'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('TemplatesService.createDraft (per-language variables)', () => {
  let prisma: any;
  let service: TemplatesService;
  beforeEach(() => {
    prisma = {
      template: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn((a: any) => Promise.resolve({ id: 'x', ...a.data })) },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };
    service = new TemplatesService(prisma, {} as any, {} as any);
  });

  it('writes each variant its OWN variables array', async () => {
    await service.createDraft({
      name: 'promo', category: 'MARKETING',
      variants: [
        { language: 'EN', bodyText: 'Hi {{1}}', variables: ['name'] },
        { language: 'MS', bodyText: 'Hai {{1}} {{2}}', variables: ['name', 'topic'] },
      ],
    } as any, 'u1');
    const created = prisma.template.create.mock.calls.map((c: any) => c[0].data);
    const en = created.find((d: any) => d.language === 'EN');
    const ms = created.find((d: any) => d.language === 'MS');
    expect(en.variables).toEqual(['name']);
    expect(ms.variables).toEqual(['name', 'topic']);
  });
});
