import { BlastProcessor } from '../blast.processor';

function makeProcessor(overrides: {
  template: { status: string; name: string; language: string; variables: string[] };
  blastScheduledAt: Date;
  graceMs?: number;
  recheckMs?: number;
}) {
  const messageUpdate = jest.fn().mockResolvedValue({});
  const blastUpdate = jest.fn().mockResolvedValue({});
  const prisma: any = {
    message: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'm1', status: 'QUEUED', blastId: 'b1', templateId: 't1', contactId: 'c1',
      }),
      update: messageUpdate,
      count: jest.fn().mockResolvedValue(0),
    },
    contact: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', phoneE164: '+60123', languagePreference: 'EN' }) },
    template: { findUnique: jest.fn().mockResolvedValue({ id: 't1', ...overrides.template }) },
    blast: { findUnique: jest.fn().mockResolvedValue({ id: 'b1', status: 'RUNNING', scheduledAt: overrides.blastScheduledAt, variableMapping: {} }), update: blastUpdate },
  };
  const whatsapp: any = { sendMessage: jest.fn().mockResolvedValue({ metaMessageId: 'meta1' }) };
  const limiter: any = { consume: jest.fn().mockResolvedValue({ ok: true }) };
  const settings: any = { get: jest.fn().mockResolvedValue('UNLIMITED') };
  const config: any = {
    get: (k: string) => (k === 'ASSISTANT_TEMPLATE_GRACE_MS' ? String(overrides.graceMs ?? 86400000)
      : k === 'ASSISTANT_TEMPLATE_RECHECK_MS' ? String(overrides.recheckMs ?? 300000) : undefined),
  };
  const proc = new BlastProcessor(prisma, whatsapp, limiter, settings, config);
  return { proc, whatsapp, messageUpdate, blastUpdate };
}

const job = () => ({ data: { messageId: 'm1' }, moveToDelayed: jest.fn().mockResolvedValue(undefined) } as any);

describe('BlastProcessor fire-time template guard', () => {
  it('sends when the template is APPROVED', async () => {
    const { proc, whatsapp } = makeProcessor({
      template: { status: 'APPROVED', name: 'car_a', language: 'EN', variables: [] },
      blastScheduledAt: new Date(Date.now() - 1000),
    });
    await proc.process(job());
    expect(whatsapp.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('holds (moveToDelayed, no send) when PENDING and inside the grace window', async () => {
    const j = job();
    const { proc, whatsapp } = makeProcessor({
      template: { status: 'PENDING', name: 'car_a', language: 'EN', variables: [] },
      blastScheduledAt: new Date(Date.now() - 1000),
      graceMs: 86400000,
    });
    await proc.process(j);
    expect(whatsapp.sendMessage).not.toHaveBeenCalled();
    expect(j.moveToDelayed).toHaveBeenCalledTimes(1);
  });

  it('fails the message when PENDING past the grace window', async () => {
    const { proc, whatsapp, messageUpdate } = makeProcessor({
      template: { status: 'PENDING', name: 'car_a', language: 'EN', variables: [] },
      blastScheduledAt: new Date(Date.now() - 100000),
      graceMs: 1, // already exceeded
    });
    await proc.process(job());
    expect(whatsapp.sendMessage).not.toHaveBeenCalled();
    expect(messageUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', errorCode: 'TEMPLATE_NOT_APPROVED' }),
    }));
  });

  it('fails immediately when the template is REJECTED', async () => {
    const { proc, whatsapp, messageUpdate } = makeProcessor({
      template: { status: 'REJECTED', name: 'car_a', language: 'EN', variables: [] },
      blastScheduledAt: new Date(Date.now() - 1000),
    });
    await proc.process(job());
    expect(whatsapp.sendMessage).not.toHaveBeenCalled();
    expect(messageUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', errorCode: 'TEMPLATE_NOT_APPROVED' }),
    }));
  });
});
