import { BlastProcessor } from '../blast.processor';

describe('BlastProcessor', () => {
  let prisma: any;
  let whatsapp: { sendMessage: jest.Mock };
  let limiter: { consume: jest.Mock };
  let settings: { get: jest.Mock };
  let config: { get: jest.Mock };
  let processor: BlastProcessor;

  beforeEach(() => {
    prisma = {
      message: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        count: jest.fn(),
      },
      blast: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      template: {
        findUnique: jest.fn(),
      },
      contact: {
        findUnique: jest.fn(),
      },
    };
    whatsapp = { sendMessage: jest.fn() };
    limiter = { consume: jest.fn().mockResolvedValue({ ok: true }) };
    settings = { get: jest.fn().mockResolvedValue('TIER_1') };
    config = { get: jest.fn().mockReturnValue(undefined) };
    processor = new BlastProcessor(prisma, whatsapp as any, limiter as any, settings as any, config as any);
  });

  it('marks message SENT after successful send', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1', blastId: 'b1', contactId: 'c1', templateId: 't1', status: 'QUEUED',
    });
    prisma.contact.findUnique.mockResolvedValue({ id: 'c1', phoneE164: '+60123', name: 'A', languagePreference: 'EN' });
    prisma.template.findUnique.mockResolvedValue({
      id: 't1', name: 'promo', language: 'EN', bodyText: 'Hi {{1}}', variables: ['name'], status: 'APPROVED',
    });
    prisma.blast.findUnique.mockResolvedValue({ id: 'b1', variableMapping: { '1': 'contact.name' }, status: 'SCHEDULED', scheduledAt: new Date() });
    prisma.message.count.mockResolvedValue(1); // still has queued messages
    whatsapp.sendMessage.mockResolvedValue({ metaMessageId: 'wamid.xyz' });

    await processor.process({ data: { messageId: 'm1' } } as any);

    expect(prisma.message.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'm1' },
      data: expect.objectContaining({ status: 'SENT', metaMessageId: 'wamid.xyz' }),
    }));
  });

  it('marks message FAILED when Meta returns 4xx', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1', blastId: 'b1', contactId: 'c1', templateId: 't1', status: 'QUEUED',
    });
    prisma.contact.findUnique.mockResolvedValue({ id: 'c1', phoneE164: '+60123', name: 'A', languagePreference: 'EN' });
    prisma.template.findUnique.mockResolvedValue({ id: 't1', name: 'p', language: 'EN', bodyText: 'x', variables: [], status: 'APPROVED' });
    prisma.blast.findUnique.mockResolvedValue({ id: 'b1', variableMapping: {}, status: 'RUNNING', scheduledAt: new Date() });
    whatsapp.sendMessage.mockRejectedValue(new Error('Recipient is not a WhatsApp user'));

    await expect(processor.process({ data: { messageId: 'm1' } } as any)).rejects.toThrow();

    expect(prisma.message.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'm1' },
      data: expect.objectContaining({ status: 'FAILED' }),
    }));
  });

  it('skips already-CANCELED messages', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', status: 'CANCELED' });
    await processor.process({ data: { messageId: 'm1' } } as any);
    expect(whatsapp.sendMessage).not.toHaveBeenCalled();
  });

  it('transitions blast to RUNNING on first send', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', blastId: 'b1', contactId: 'c1', templateId: 't1', status: 'QUEUED' });
    prisma.contact.findUnique.mockResolvedValue({ id: 'c1', phoneE164: '+60123', name: 'A', languagePreference: 'EN' });
    prisma.template.findUnique.mockResolvedValue({ id: 't1', name: 'p', language: 'EN', bodyText: 'x', variables: [], status: 'APPROVED' });
    prisma.blast.findUnique.mockResolvedValue({ id: 'b1', variableMapping: {}, status: 'SCHEDULED', scheduledAt: new Date() });
    prisma.message.count.mockResolvedValue(2);
    whatsapp.sendMessage.mockResolvedValue({ metaMessageId: 'wamid.xyz' });

    await processor.process({ data: { messageId: 'm1' } } as any);

    expect(prisma.blast.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'b1', status: 'SCHEDULED' },
      data: expect.objectContaining({ status: 'RUNNING', startedAt: expect.any(Date) }),
    }));
  });
});
