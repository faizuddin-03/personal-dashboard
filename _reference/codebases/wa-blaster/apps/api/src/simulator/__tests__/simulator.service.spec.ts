import { ConfigService } from '@nestjs/config';
import { SimulatorService } from '../simulator.service';

function makeService(over: { prisma?: any; chatbot?: any; settings?: any; env?: Record<string, string> } = {}) {
  const handleInbound = jest.fn().mockResolvedValue(undefined);
  const prisma = {
    contact: {
      upsert: jest.fn().mockResolvedValue({ id: 'c1' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'c1' }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'c1' }),
    },
    conversation: {
      findFirst: jest.fn().mockResolvedValue({ id: 'conv1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    chatbotDecision: {
      findFirst: jest.fn().mockResolvedValue({
        kind: 'ESCALATE', reason: 'opt_out_requested', intent: null, intentConfidence: null,
        draftConfidence: null, modelUsed: null, embeddingModelUsed: null, chunksRetrieved: 0,
        topChunkScore: null, totalLatencyMs: 1, retrievalLatencyMs: null,
      }),
    },
    conversationOutboundMessage: { findFirst: jest.fn().mockResolvedValue(null) },
    botDraft: { findFirst: jest.fn().mockResolvedValue(null) },
    ...over.prisma,
  };
  const settings = { patch: jest.fn().mockResolvedValue(undefined), reload: jest.fn().mockResolvedValue(undefined), get: jest.fn().mockResolvedValue(true), ...over.settings };
  const chatbot = { handleInbound, ...over.chatbot };
  const config = { get: (k: string, d?: string) => (over.env ?? {})[k] ?? d } as unknown as ConfigService;
  return { svc: new SimulatorService(prisma, chatbot, settings, config), handleInbound, prisma, settings };
}

describe('SimulatorService.simulateInbound', () => {
  it('ensures the sandbox contact, calls handleInbound once with a text payload, returns a SimResult', async () => {
    const { svc, handleInbound, prisma } = makeService();
    const res = await svc.simulateInbound('60123456789', 'stop');

    expect(prisma.contact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { phoneE164: '+60123456789' } }),
    );
    expect(handleInbound).toHaveBeenCalledTimes(1);
    const payload = handleInbound.mock.calls[0][0];
    expect(payload.message.text.body).toBe('stop');
    expect(payload.message.from).toBe('60123456789');
    expect(res.subKind).toBe('safety_escalate');
    expect(res.customerReply).toBeNull();
  });
});

describe('SimulatorService.reset', () => {
  it('deletes the contact conversations and reports the count', async () => {
    const { svc, prisma } = makeService();
    const out = await svc.reset('+60123456789');
    expect(prisma.conversation.deleteMany).toHaveBeenCalledWith({ where: { contactId: 'c1' } });
    expect(out).toEqual({ deletedConversations: 2 });
  });

  it('is a no-op when the contact does not exist', async () => {
    const { svc } = makeService({ prisma: { contact: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn(), findUniqueOrThrow: jest.fn() } } });
    expect(await svc.reset('+60111')).toEqual({ deletedConversations: 0 });
  });
});

describe('SimulatorService.status', () => {
  it('reports flags from config and the chatbot enabled setting', async () => {
    const { svc } = makeService({ env: { SIMULATOR_ENABLED: 'true', WHATSAPP_MOCK_MODE: 'true', LLM_MOCK_MODE: 'false', EMBEDDINGS_MOCK_MODE: 'true' } });
    const s = await svc.status();
    expect(s).toEqual({ simulatorEnabled: true, whatsappMock: true, llmMock: false, embeddingsMock: true, chatbotEnabled: true });
  });
});

describe('SimulatorService.getThread', () => {
  it('merges chat in/out + a rendered blast, ordered by time, with phone-POV direction', async () => {
    const prisma = {
      contact: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', name: 'Sim 6789', phoneE164: '+60123456789' }) },
      conversation: { findMany: jest.fn().mockResolvedValue([{ id: 'conv1' }]) },
      conversationInboundMessage: {
        findMany: jest.fn().mockResolvedValue([{ id: 'in1', body: 'hello', receivedAt: new Date('2026-06-21T10:00:02Z') }]),
      },
      conversationOutboundMessage: {
        findMany: jest.fn().mockResolvedValue([{ id: 'out1', body: 'hi there', kind: 'AUTO_REPLY', sentAt: new Date('2026-06-21T10:00:03Z'), createdAt: new Date('2026-06-21T10:00:03Z') }]),
      },
      message: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'm1', source: 'BLAST', status: 'SENT', templateId: 't1', blastId: 'b1', body: null, sentAt: new Date('2026-06-21T10:00:01Z') },
        ]),
      },
      template: { findMany: jest.fn().mockResolvedValue([{ id: 't1', name: 'promo', language: 'EN', bodyText: 'Hi {{1}}!' }]) },
      blast: { findMany: jest.fn().mockResolvedValue([{ id: 'b1', variableMapping: { '1': 'contact.name' }, scheduledAt: new Date('2026-06-21T09:59:00Z') }]) },
    };
    const settings = { patch: jest.fn(), reload: jest.fn(), get: jest.fn() };
    const config = { get: (_k: string, d?: string) => d } as any;
    const { SimulatorService } = require('../simulator.service');
    const svc = new SimulatorService(prisma, { handleInbound: jest.fn() }, settings, config);

    const out = await svc.getThread('60123456789');

    expect(out.contactId).toBe('c1');
    expect(out.items.map((i: any) => i.id)).toEqual(['m1', 'in1', 'out1']); // time order
    const blast = out.items.find((i: any) => i.id === 'm1');
    expect(blast.direction).toBe('incoming');
    expect(blast.kind).toBe('blast');
    expect(blast.body).toBe('Hi Sim 6789!'); // rendered from template + mapping + contact
    expect(blast.meta).toEqual({ status: 'SENT', templateName: 'promo', language: 'EN' });
    expect(out.items.find((i: any) => i.id === 'in1').direction).toBe('outgoing'); // phone -> business
    expect(out.items.find((i: any) => i.id === 'out1').kind).toBe('bot_reply');
  });

  it('returns empty items when the contact does not exist', async () => {
    const prisma = { contact: { findUnique: jest.fn().mockResolvedValue(null) } };
    const { SimulatorService } = require('../simulator.service');
    const svc = new SimulatorService(prisma, { handleInbound: jest.fn() }, { patch: jest.fn(), reload: jest.fn(), get: jest.fn() }, { get: (_k: string, d?: string) => d } as any);
    expect(await svc.getThread('+60111')).toEqual({ phone: '+60111', contactId: null, items: [] });
  });
});
