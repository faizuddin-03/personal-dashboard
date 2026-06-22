import { randomUUID } from 'crypto';
import { BadGatewayException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService } from '../conversations/conversation.service';
import { ChatbotWhatsappError } from '../whatsapp/chatbot-whatsapp.error';
import { ChatbotWhatsappService } from '../whatsapp/chatbot-whatsapp.service';
import { DraftsService } from './drafts.service';

/**
 * Integration tests: DraftsService is straight Prisma + transactions over Postgres, so we exercise
 * the real state machine, constraints and cascades rather than mocking them. The only mocked
 * collaborator is the chatbot WhatsApp client (no real Meta call in the operator-approval path).
 */
const prisma = new PrismaClient() as unknown as PrismaService;
const queue = { add: jest.fn().mockResolvedValue(undefined) };
const conversations = new ConversationService(prisma, queue as unknown as Queue);
const whatsapp = { sendTextMessage: jest.fn() };
const svc = new DraftsService(prisma, whatsapp as unknown as ChatbotWhatsappService, conversations);

const contactIds = new Set<string>();

function uniquePhone(): string {
  const digits = randomUUID().replace(/[^0-9]/g, '') + '0000000000';
  return `+1${digits.slice(0, 10)}`;
}

async function makeContact(): Promise<{ id: string; phone: string }> {
  const id = randomUUID();
  const phone = uniquePhone();
  await prisma.$executeRawUnsafe(
    `INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid, $2, NOW())`,
    id,
    phone,
  );
  contactIds.add(id);
  return { id, phone };
}

const draftScalars = {
  body: 'When does my order ship?', // operator context = the customer's own question, NOT a reply
  intent: 'q',
  intentConfidence: 0.9,
  draftConfidence: 0.9,
  modelUsed: 'mock',
  embeddingModelUsed: 'mock',
  latencyMs: 5,
};

/** The vetted AI suggestion stored on a send-failure-fallback draft (what Approve should send). */
const SUGGESTED_REPLY = 'Your order ships within 3 business days.';

/**
 * Seed a contact + ESCALATED conversation + inbound + PENDING BotDraft; returns their ids.
 * By default the draft carries a sendable `suggestedReply` (the send-failure-fallback shape); pass
 * `{ suggestedReply: null }` for a safety/consent escalation that has no AI suggestion to approve.
 */
async function seedPendingDraft(opts: { suggestedReply?: string | null } = {}) {
  const contact = await makeContact();
  const conversation = await prisma.conversation.create({
    data: { contactId: contact.id, state: 'ESCALATED', lastInboundAt: new Date() },
  });
  const inbound = await prisma.conversationInboundMessage.create({
    data: {
      conversationId: conversation.id,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'When does my order ship?',
      receivedAt: new Date(),
      rawJson: {},
    },
  });
  const draft = await prisma.botDraft.create({
    data: {
      conversationId: conversation.id,
      inboundMessageId: inbound.id,
      ...draftScalars,
      suggestedReply: opts.suggestedReply === undefined ? SUGGESTED_REPLY : opts.suggestedReply,
      state: 'PENDING',
    },
  });
  return { contact, conversation, inbound, draft };
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // Cascades from contacts → conversations → drafts/messages clean up everything we seeded.
  for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
  await prisma.$disconnect();
});

beforeEach(() => {
  // Unique id per send — meta_message_id is @unique, so a static value would collide across tests.
  whatsapp.sendTextMessage.mockReset().mockImplementation(async () => ({ metaMessageId: `wamid.mock-${randomUUID()}` }));
});

describe('DraftsService.list', () => {
  it('returns PENDING drafts by default, scoped to a conversation, with contact + citations', async () => {
    const { conversation, draft } = await seedPendingDraft();

    const res = await svc.list({ conversationId: conversation.id });

    expect(res.page).toBe(1);
    expect(res.limit).toBe(20);
    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
    const item = res.items[0] as Record<string, unknown> & { conversation: { contact: unknown }; citations: unknown };
    expect(item.id).toBe(draft.id);
    expect(item.state).toBe('PENDING');
    expect(item.conversation.contact).toBeDefined();
    expect(Array.isArray(item.citations)).toBe(true);
    // The list payload exposes the AI suggestion so the UI can show it next to the operator context.
    expect(item.suggestedReply).toBe(SUGGESTED_REPLY);
  });

  it('excludes non-PENDING drafts when no explicit state filter is given', async () => {
    const { conversation, draft } = await seedPendingDraft();
    await prisma.botDraft.update({ where: { id: draft.id }, data: { state: 'SENT' } });

    const res = await svc.list({ conversationId: conversation.id });

    expect(res.total).toBe(0);
    expect(res.items).toHaveLength(0);
  });

  it('hides a PENDING draft once its conversation is no longer ESCALATED (a human took over → REPLIED)', async () => {
    const { conversation, draft } = await seedPendingDraft();
    await prisma.conversation.update({ where: { id: conversation.id }, data: { state: 'REPLIED' } });

    const res = await svc.list({ conversationId: conversation.id });

    expect(res.total).toBe(0);
    expect(res.items.some((d) => d.id === draft.id)).toBe(false);
  });

  it('hides a PENDING draft once its conversation is assigned to an operator', async () => {
    const { conversation, draft } = await seedPendingDraft();
    await prisma.conversation.update({ where: { id: conversation.id }, data: { assignedToId: randomUUID() } });

    const res = await svc.list({ conversationId: conversation.id });

    expect(res.total).toBe(0);
    expect(res.items.some((d) => d.id === draft.id)).toBe(false);
  });
});

describe('DraftsService.approve', () => {
  it('sends the AI suggestion (not the body), marks the draft SENT, records an OPERATOR_REPLY, and moves to REPLIED', async () => {
    const { contact, conversation, draft } = await seedPendingDraft();
    const userId = randomUUID();

    const result = await svc.approve(draft.id, userId);

    // Sends suggestedReply verbatim — never draft.body (the customer's own question / operator context).
    expect(whatsapp.sendTextMessage).toHaveBeenCalledWith(contact.phone, SUGGESTED_REPLY);
    expect(whatsapp.sendTextMessage).not.toHaveBeenCalledWith(contact.phone, draftScalars.body);

    const after = await prisma.botDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(after.state).toBe('SENT');
    expect(after.approvedByUserId).toBe(userId);

    const { metaMessageId } = await whatsapp.sendTextMessage.mock.results[0].value;
    const outbound = await prisma.conversationOutboundMessage.findUniqueOrThrow({ where: { botDraftId: draft.id } });
    expect(outbound.kind).toBe('OPERATOR_REPLY');
    expect(outbound.body).toBe(SUGGESTED_REPLY);
    expect(outbound.sentByUserId).toBe(userId);
    expect(outbound.metaMessageId).toBe(metaMessageId);

    const conv = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(conv.state).toBe('REPLIED');
    expect(conv.lastOutboundAt).not.toBeNull();

    expect(result.draft.state).toBe('SENT');
  });

  it('throws ConflictException(NO_SUGGESTION) and never sends when the draft has no AI suggestion (safety escalation)', async () => {
    const { draft } = await seedPendingDraft({ suggestedReply: null });

    await expect(svc.approve(draft.id, randomUUID())).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.approve(draft.id, randomUUID())).rejects.toMatchObject({ response: { code: 'NO_SUGGESTION' } });
    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();

    const after = await prisma.botDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(after.state).toBe('PENDING'); // unchanged — operator must compose a reply instead
  });

  it('throws ConflictException(INVALID_DRAFT_STATE) when the draft is not PENDING and never sends', async () => {
    const { draft } = await seedPendingDraft();
    await prisma.botDraft.update({ where: { id: draft.id }, data: { state: 'SENT' } });

    await expect(svc.approve(draft.id, randomUUID())).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.approve(draft.id, randomUUID())).rejects.toMatchObject({
      response: { code: 'INVALID_DRAFT_STATE' },
    });
    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });

  it('throws NotFoundException for a missing draft', async () => {
    await expect(svc.approve(randomUUID(), randomUUID())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rethrows a ChatbotWhatsappError as BadGatewayException and does not mutate state', async () => {
    const { conversation, draft } = await seedPendingDraft();
    whatsapp.sendTextMessage.mockRejectedValueOnce(new ChatbotWhatsappError('meta down'));

    await expect(svc.approve(draft.id, randomUUID())).rejects.toBeInstanceOf(BadGatewayException);

    const after = await prisma.botDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(after.state).toBe('PENDING');
    const conv = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(conv.state).toBe('ESCALATED');
  });

  it('throws ConflictException(CS_WINDOW_CLOSED) and never sends when the CS window has closed', async () => {
    const { conversation, draft } = await seedPendingDraft();
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    });

    await expect(svc.approve(draft.id, randomUUID())).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.approve(draft.id, randomUUID())).rejects.toMatchObject({ response: { code: 'CS_WINDOW_CLOSED' } });
    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();

    const after = await prisma.botDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(after.state).toBe('PENDING');
  });
});

describe('DraftsService.edit', () => {
  it('sends the edited body, marks the draft EDITED with editedBody, and records the edited outbound', async () => {
    const { contact, draft } = await seedPendingDraft();
    const userId = randomUUID();
    const editedBody = 'Your order ships tomorrow morning.';

    await svc.edit(draft.id, userId, editedBody);

    expect(whatsapp.sendTextMessage).toHaveBeenCalledWith(contact.phone, editedBody);

    const after = await prisma.botDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(after.state).toBe('EDITED');
    expect(after.editedBody).toBe(editedBody);
    expect(after.approvedByUserId).toBe(userId);

    const outbound = await prisma.conversationOutboundMessage.findUniqueOrThrow({ where: { botDraftId: draft.id } });
    expect(outbound.body).toBe(editedBody);
    expect(outbound.kind).toBe('OPERATOR_REPLY');
  });
});

describe('DraftsService.reject', () => {
  it('marks the draft REJECTED with the reason, moves the conversation to AWAITING_REPLY, and never sends', async () => {
    const { conversation, draft } = await seedPendingDraft();

    const result = await svc.reject(draft.id, randomUUID(), 'tone is off');

    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();

    const after = await prisma.botDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(after.state).toBe('REJECTED');
    expect(after.rejectionReason).toBe('tone is off');

    const conv = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(conv.state).toBe('AWAITING_REPLY');

    expect(result.draft.state).toBe('REJECTED');
  });

  it('stores null when no reason is supplied', async () => {
    const { draft } = await seedPendingDraft();

    await svc.reject(draft.id, randomUUID());

    const after = await prisma.botDraft.findUniqueOrThrow({ where: { id: draft.id } });
    expect(after.rejectionReason).toBeNull();
  });

  it('throws ConflictException(INVALID_DRAFT_STATE) for a non-PENDING draft', async () => {
    const { draft } = await seedPendingDraft();
    await prisma.botDraft.update({ where: { id: draft.id }, data: { state: 'REJECTED' } });

    await expect(svc.reject(draft.id, randomUUID())).rejects.toMatchObject({
      response: { code: 'INVALID_DRAFT_STATE' },
    });
  });
});
