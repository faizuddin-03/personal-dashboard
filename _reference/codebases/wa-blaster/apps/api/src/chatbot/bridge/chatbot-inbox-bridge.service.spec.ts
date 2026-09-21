import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotInboxBridge, mapEscalationReason } from './chatbot-inbox-bridge.service';

const prisma = new PrismaClient() as unknown as PrismaService;
const bridge = new ChatbotInboxBridge(prisma);

const contactIds = new Set<string>();

async function makeContact(): Promise<string> {
  const id = randomUUID();
  const digits = id.replace(/\D/g, '').slice(0, 9).padEnd(9, '0');
  await prisma.$executeRawUnsafe(
    `INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid, $2, NOW())`,
    id,
    `+19${digits}`,
  );
  contactIds.add(id);
  return id;
}

async function makeConversation(contactId: string): Promise<string> {
  const conv = await prisma.conversation.create({
    data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() },
  });
  return conv.id;
}

beforeAll(async () => { await prisma.$connect(); });
afterAll(async () => {
  for (const id of contactIds) {
    await prisma.$executeRawUnsafe(`DELETE FROM autopilot_events WHERE contact_id = $1::uuid`, id);
    await prisma.$executeRawUnsafe(`DELETE FROM messages WHERE contact_id = $1::uuid`, id);
    await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
  }
  await prisma.$disconnect();
});

describe('mapEscalationReason', () => {
  it.each([
    ['complaint', 'COMPLAINT'],
    ['low_intent_confidence', 'LOW_CONFIDENCE'],
    ['guardrail_no_unknown_promises', 'SENSITIVE'],
    ['knowledge_gap', 'KNOWLEDGE_GAP'],
    ['out_of_hours', 'SENSITIVE'],
    ['dispatch_failure', 'SENSITIVE'],
    ['opt_out_requested', 'SENSITIVE'],
  ])('maps %s -> %s', (reason, expected) => {
    expect(mapEscalationReason(reason)).toBe(expected);
  });
});

describe('ChatbotInboxBridge.recordAutoReply', () => {
  it('writes an AUTO_REPLIED AutopilotEvent and mirrors a CHATBOT Message', async () => {
    const contactId = await makeContact();

    await bridge.recordAutoReply({
      contactId,
      intent: 'vehicle_history',
      confidence: 0.92,
      replyText: 'We open at 9am daily.',
      metaMessageId: `wamid-${randomUUID()}`,
      model: 'qwen3',
    });

    const event = await prisma.autopilotEvent.findFirst({
      where: { contactId, action: 'AUTO_REPLIED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(event).not.toBeNull();
    expect(event!.replyText).toBe('We open at 9am daily.');
    expect(event!.confidence).toBeCloseTo(0.92);

    const message = await prisma.message.findFirst({ where: { contactId, source: 'CHATBOT' } });
    expect(message).not.toBeNull();
    expect(message!.body).toBe('We open at 9am daily.');
    expect(message!.status).toBe('SENT');
  });

  it('never throws on a DB error (best-effort)', async () => {
    await expect(
      bridge.recordAutoReply({ contactId: randomUUID(), replyText: 'hi' }),
    ).resolves.toBeUndefined();
  });
});

describe('ChatbotInboxBridge.recordEscalation', () => {
  it('writes an ESCALATED AutopilotEvent and a Ticket linked to the conversation', async () => {
    const contactId = await makeContact();
    const conversationId = await makeConversation(contactId);

    await bridge.recordEscalation({
      contactId,
      conversationId,
      reason: 'complaint',
      intent: 'complaint',
    });

    const event = await prisma.autopilotEvent.findFirst({
      where: { contactId, action: 'ESCALATED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(event).not.toBeNull();
    expect(event!.reason).toBe('COMPLAINT');

    const ticket = await prisma.ticket.findFirst({ where: { conversationId } });
    expect(ticket).not.toBeNull();
    expect(ticket!.reason).toBe('COMPLAINT');
    expect(ticket!.autopilotEventId).toBe(event!.id);
    expect(ticket!.status).toBe('OPEN');
  });

  it('maps an unknown chatbot reason to the SENSITIVE catch-all', async () => {
    const contactId = await makeContact();
    const conversationId = await makeConversation(contactId);

    await bridge.recordEscalation({ contactId, conversationId, reason: 'out_of_hours' });

    const ticket = await prisma.ticket.findFirst({ where: { conversationId } });
    expect(ticket!.reason).toBe('SENSITIVE');
  });

  it('never throws on a DB error (best-effort)', async () => {
    await expect(
      bridge.recordEscalation({ contactId: randomUUID(), conversationId: randomUUID(), reason: 'complaint' }),
    ).resolves.toBeUndefined();
  });
});

describe('ChatbotInboxBridge.mirrorOperatorReply', () => {
  it('mirrors an operator reply into a Message with source INBOX', async () => {
    const contactId = await makeContact();
    await bridge.mirrorOperatorReply({ contactId, body: 'Operator here — sorted!', metaMessageId: `wamid-${randomUUID()}` });
    const message = await prisma.message.findFirst({ where: { contactId, source: 'INBOX', body: 'Operator here — sorted!' } });
    expect(message).not.toBeNull();
    expect(message!.status).toBe('SENT');
  });

  it('never throws on a DB error (best-effort)', async () => {
    await expect(bridge.mirrorOperatorReply({ contactId: randomUUID(), body: 'x' })).resolves.toBeUndefined();
  });
});
