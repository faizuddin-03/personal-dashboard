import { CampaignContextService } from '../campaign-context.service';

const CONTACT = { id: 'c1', phoneE164: '+60123456789', name: 'Ali' } as any;

function buildPrisma(over: {
  findFirst?: any;
  findMany?: any;
  blast?: any;
  template?: any;
}) {
  return {
    message: {
      findFirst: jest.fn(async () => over.findFirst ?? null),
      findMany: jest.fn(async () => over.findMany ?? []),
    },
    blast: { findUnique: jest.fn(async () => over.blast ?? null) },
    template: { findUnique: jest.fn(async () => over.template ?? null) },
  } as any;
}

describe('CampaignContextService', () => {
  it('uses an exact quote-reply match and skips the time heuristic', async () => {
    const prisma = buildPrisma({
      findFirst: { blastId: 'b1', templateId: 't1' },
      blast: { id: 'b1', name: 'June Promo', variableMapping: {} },
      template: { id: 't1', bodyText: 'Get 15% off until 30 June.' },
    });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT, replyToMetaMessageId: 'wamid.blast1' });

    expect(ctx).toEqual({ blastId: 'b1', campaignName: 'June Promo', renderedText: 'Get 15% off until 30 June.' });
    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('falls back to the most-recent blast within the window when there is no quote-reply', async () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000); // 1h ago
    const prisma = buildPrisma({
      findMany: [{ id: 'm1', blastId: 'b1', status: 'SENT', sentAt: recent, templateId: 't1' }],
      blast: { id: 'b1', name: 'June Promo', variableMapping: {} },
      template: { id: 't1', bodyText: 'Get 15% off until 30 June.' },
    });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT });

    expect(prisma.message.findFirst).not.toHaveBeenCalled();
    expect(ctx?.blastId).toBe('b1');
    expect(ctx?.renderedText).toBe('Get 15% off until 30 June.');
  });

  it('returns null when no blast falls within the window', async () => {
    const prisma = buildPrisma({ findMany: [] });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT });

    expect(ctx).toBeNull();
  });

  it('returns null when the matched blast message has no templateId', async () => {
    const prisma = buildPrisma({ findFirst: { blastId: 'b1', templateId: null } });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT, replyToMetaMessageId: 'wamid.x' });

    expect(ctx).toBeNull();
    expect(prisma.blast.findUnique).not.toHaveBeenCalled();
  });

  it('renders template variables against the contact', async () => {
    const prisma = buildPrisma({
      findFirst: { blastId: 'b1', templateId: 't1' },
      blast: { id: 'b1', name: 'Promo', variableMapping: { '1': 'contact.name', '2': 'literal:15%' } },
      template: { id: 't1', bodyText: 'Hi {{1}}, get {{2}} off!' },
    });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT, replyToMetaMessageId: 'wamid.x' });

    expect(ctx?.renderedText).toBe('Hi Ali, get 15% off!');
  });
});
