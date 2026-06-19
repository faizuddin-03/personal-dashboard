import { randomUUID } from 'crypto';
import { ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService, CHATBOT_RESOLUTION_CAPTURE_QUEUE } from './conversation.service';

/**
 * Integration tests: ConversationService is straight Prisma + transactions over Postgres, so we
 * exercise the real state machine, constraints and cascades rather than mocking them. The only
 * mocked collaborator is the BullMQ queue (the capture worker is out of scope here).
 */
const prisma = new PrismaClient() as unknown as PrismaService;
const queue = { add: jest.fn().mockResolvedValue(undefined) };
const svc = new ConversationService(prisma, queue as unknown as Queue);

const contactIds = new Set<string>();
const docIds = new Set<string>();

const HOUR = 60 * 60 * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function uniquePhone(): string {
  const digits = randomUUID().replace(/[^0-9]/g, '') + '0000000000';
  return `+1${digits.slice(0, 10)}`;
}

async function makeContact(): Promise<string> {
  // Raw SQL (only phone_e164) keeps the helper independent of Contact's full column set, matching
  // the other chatbot integration specs — the service never touches the Contact table itself.
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid, $2, NOW())`,
    id,
    uniquePhone(),
  );
  contactIds.add(id);
  return id;
}

/** Seed a LIVE doc + one chunk via raw SQL so a citation has a valid chunk to reference. */
async function seedChunk(): Promise<string> {
  const docId = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO knowledge_documents
       (id, name, title, category, content_md, word_count, status, embedding_model, created_by, updated_at)
     VALUES ($1::uuid, $2, 'T', 'General', 'body', 1, 'LIVE'::"KnowledgeDocumentStatus", 'mock', $3::uuid, NOW())`,
    docId,
    `conv-spec-${docId}.md`,
    randomUUID(),
  );
  docIds.add(docId);
  const chunkId = randomUUID();
  const vec = `[${new Array(1024).fill(0.1).join(',')}]`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding)
     VALUES ($1::uuid, $2::uuid, 0, 'chunk', 3, $3::vector)`,
    chunkId,
    docId,
    vec,
  );
  return chunkId;
}

const draftData = {
  body: 'draft body',
  intent: 'question',
  intentConfidence: 0.9,
  draftConfidence: 0.9,
  modelUsed: 'mock',
  embeddingModelUsed: 'mock-embed',
  latencyMs: 5,
};

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
  for (const id of docIds) await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, id);
  await prisma.$disconnect();
});

afterEach(() => {
  queue.add.mockClear();
});

describe('ConversationService.handleInbound', () => {
  it('creates a NEW conversation + inbound message with a 24h CS window for a fresh contact', async () => {
    const contactId = await makeContact();
    const receivedAt = new Date();

    const { conversation, inboundMessage } = await svc.handleInbound({
      contactId,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'Hi, do you ship to Penang?',
      receivedAt,
    });

    expect(conversation.state).toBe('NEW');
    expect(conversation.lastInboundAt?.getTime()).toBe(receivedAt.getTime());
    expect(conversation.csWindowExpiresAt?.getTime()).toBe(receivedAt.getTime() + 24 * HOUR);
    expect(inboundMessage.conversationId).toBe(conversation.id);
    expect(inboundMessage.body).toBe('Hi, do you ship to Penang?');

    const count = await prisma.conversationInboundMessage.count({ where: { conversationId: conversation.id } });
    expect(count).toBe(1);
  });

  it('appends to the existing open conversation and refreshes the window WITHOUT changing state', async () => {
    const contactId = await makeContact();
    const first = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'first' });
    // The bot auto-replied, moving it to AUTO_REPLIED — a follow-up must NOT reset/auto-transition it.
    await svc.recordAutoReply({ conversationId: first.conversation.id, body: 'reply', subKind: 'rag_answer' });

    const laterReceivedAt = new Date(Date.now() + 5000);
    const second = await svc.handleInbound({
      contactId,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'second',
      receivedAt: laterReceivedAt,
    });

    expect(second.conversation.id).toBe(first.conversation.id);
    expect(second.conversation.state).toBe('AUTO_REPLIED'); // engine alone decides transitions, not handleInbound
    expect(second.conversation.lastInboundAt?.getTime()).toBe(laterReceivedAt.getTime());
    const count = await prisma.conversationInboundMessage.count({ where: { conversationId: first.conversation.id } });
    expect(count).toBe(2);
  });

  it('starts a fresh conversation when the previous one was already closed', async () => {
    const contactId = await makeContact();
    const first = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'first' });
    await svc.recordOperatorReply(first.conversation.id, 'handled', randomUUID());
    await svc.close({ conversationId: first.conversation.id, userId: randomUUID(), disposition: 'SKIP' });

    const second = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'new topic' });

    expect(second.conversation.id).not.toBe(first.conversation.id);
    expect(second.conversation.state).toBe('NEW');
  });

  it('is idempotent on metaMessageId — a redelivery returns the same row (no duplicate, no throw)', async () => {
    const contactId = await makeContact();
    const metaMessageId = `wamid-idem-${randomUUID()}`;

    const first = await svc.handleInbound({ contactId, metaMessageId, body: 'first' });
    const second = await svc.handleInbound({ contactId, metaMessageId, body: 'second (redelivery)' });

    expect(second.inboundMessage.id).toBe(first.inboundMessage.id);
    expect(second.inboundMessage.body).toBe('first'); // original preserved, not overwritten
    // createdAt preserved is the load-bearing property: hasActivityAfterInbound orders by it.
    expect(second.inboundMessage.createdAt.getTime()).toBe(first.inboundMessage.createdAt.getTime());
    expect(second.conversation.id).toBe(first.conversation.id);

    const count = await prisma.conversationInboundMessage.count({ where: { metaMessageId } });
    expect(count).toBe(1);
  });
});

describe('ConversationService.recordAutoReply', () => {
  it('records an AUTO_REPLY outbound and transitions to AUTO_REPLIED for rag_answer', async () => {
    const contactId = await makeContact();
    const { conversation } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });

    const out = await svc.recordAutoReply({
      conversationId: conversation.id,
      body: 'We open at 9am.',
      metaMessageId: `wamid-${randomUUID()}`,
      subKind: 'rag_answer',
    });

    expect(out.kind).toBe('AUTO_REPLY');
    expect(out.body).toBe('We open at 9am.');
    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('AUTO_REPLIED');
    expect(after.lastOutboundAt).not.toBeNull();
  });

  it('leaves state untouched for a consent_offer (caller records the offer separately)', async () => {
    const contactId = await makeContact();
    const { conversation } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });

    await svc.recordAutoReply({ conversationId: conversation.id, body: 'Want support?', subKind: 'consent_offer' });

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('NEW');
    const out = await prisma.conversationOutboundMessage.count({ where: { conversationId: conversation.id, kind: 'AUTO_REPLY' } });
    expect(out).toBe(1);
  });

  it('leaves state untouched for still_being_processed', async () => {
    const contactId = await makeContact();
    const { conversation } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });
    await svc.recordAutoReply({ conversationId: conversation.id, body: 'first', subKind: 'rag_answer' }); // → AUTO_REPLIED

    await svc.recordAutoReply({ conversationId: conversation.id, body: 'still processing', subKind: 'still_being_processed' });

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('AUTO_REPLIED'); // unchanged by still_being_processed
  });
});

describe('ConversationService.recordEscalation', () => {
  it('creates a PENDING BotDraft with its citations atomically and moves state to ESCALATED', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });
    const chunkId = await seedChunk();

    const draft = await svc.recordEscalation({
      conversationId: conversation.id,
      inboundMessageId: inboundMessage.id,
      draftData,
      citations: [{ chunkId, similarityScore: 0.91, rank: 1 }],
    });

    expect(draft.state).toBe('PENDING');
    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('ESCALATED');
    const citations = await prisma.botDraftCitation.findMany({ where: { botDraftId: draft.id } });
    expect(citations).toHaveLength(1);
    expect(citations[0].chunkId).toBe(chunkId);
    expect(citations[0].rank).toBe(1);
  });
});

describe('ConversationService.recordEscalationOffer', () => {
  it('moves to ESCALATION_OFFERED and stamps the offer time + original inbound id', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });

    await svc.recordEscalationOffer(conversation.id, inboundMessage.id);

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('ESCALATION_OFFERED');
    expect(after.escalationOfferedAt).not.toBeNull();
    expect(after.escalationOfferInboundId).toBe(inboundMessage.id);
  });
});

describe('ConversationService.clearOfferState', () => {
  it('returns to NEW when the bot never substantively replied before the offer', async () => {
    const contactId = await makeContact();
    const recentlyReceived = new Date(Date.now() - 60_000);
    const { conversation, inboundMessage } = await svc.handleInbound({
      contactId,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'q',
      receivedAt: recentlyReceived,
    });
    // Mirror the real decline flow: offer + decline-ack are both AUTO_REPLY outbounds, sent AFTER the inbound.
    await svc.recordAutoReply({ conversationId: conversation.id, body: 'offer?', subKind: 'consent_offer' });
    await svc.recordEscalationOffer(conversation.id, inboundMessage.id);
    await svc.recordAutoReply({ conversationId: conversation.id, body: 'no problem', subKind: 'escalation_declined_ack' });

    await svc.clearOfferState(conversation.id);

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('NEW');
    expect(after.escalationOfferedAt).toBeNull();
    expect(after.escalationOfferInboundId).toBeNull();
  });

  it('returns to AUTO_REPLIED when a substantive reply preceded the offer', async () => {
    const contactId = await makeContact();
    // Prior turn: a real rag_answer well before the offer-triggering inbound.
    const { conversation } = await svc.handleInbound({
      contactId,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'first',
      receivedAt: new Date(Date.now() - 120_000),
    });
    await prisma.conversationOutboundMessage.create({
      data: { conversationId: conversation.id, body: 'prior answer', kind: 'AUTO_REPLY', sentAt: new Date(Date.now() - 90_000) },
    });
    // The offer-triggering follow-up inbound.
    const trigger = await svc.handleInbound({
      contactId,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'follow up',
      receivedAt: new Date(Date.now() - 60_000),
    });
    await svc.recordEscalationOffer(conversation.id, trigger.inboundMessage.id);
    await svc.recordAutoReply({ conversationId: conversation.id, body: 'offer?', subKind: 'consent_offer' });

    await svc.clearOfferState(conversation.id);

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('AUTO_REPLIED');
    expect(after.escalationOfferInboundId).toBeNull();
  });
});

describe('ConversationService escalation/offer queries', () => {
  it('hasPendingEscalation is true iff a PENDING BotDraft exists', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });

    expect(await svc.hasPendingEscalation(conversation.id)).toBe(false);

    await svc.recordEscalation({ conversationId: conversation.id, inboundMessageId: inboundMessage.id, draftData, citations: [] });

    expect(await svc.hasPendingEscalation(conversation.id)).toBe(true);
  });

  it('isOfferingEscalation is true only while ESCALATION_OFFERED and the offer is under 24h old', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });
    expect(await svc.isOfferingEscalation(conversation.id)).toBe(false);

    await svc.recordEscalationOffer(conversation.id, inboundMessage.id);
    expect(await svc.isOfferingEscalation(conversation.id)).toBe(true);

    // Age the offer past 24h → auto-expires.
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { escalationOfferedAt: new Date(Date.now() - 25 * HOUR) },
    });
    expect(await svc.isOfferingEscalation(conversation.id)).toBe(false);
  });

  it('getEscalationOfferOriginalInboundId returns the stored inbound id', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });
    await svc.recordEscalationOffer(conversation.id, inboundMessage.id);

    expect(await svc.getEscalationOfferOriginalInboundId(conversation.id)).toBe(inboundMessage.id);
  });
});

describe('ConversationService.recordOperatorReply', () => {
  it('records an OPERATOR_REPLY outbound with the user id and moves state to REPLIED', async () => {
    const contactId = await makeContact();
    const { conversation } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });
    const userId = randomUUID();

    const out = await svc.recordOperatorReply(conversation.id, 'Here you go!', userId, `wamid-${randomUUID()}`);

    expect(out.kind).toBe('OPERATOR_REPLY');
    expect(out.sentByUserId).toBe(userId);
    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('REPLIED');
  });
});

describe('ConversationService.getCsWindowOpen', () => {
  it('is true within 24h of the last inbound and false beyond it', async () => {
    const contactId = await makeContact();
    const { conversation } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });

    expect(await svc.getCsWindowOpen(conversation.id)).toBe(true);

    await prisma.conversation.update({ where: { id: conversation.id }, data: { lastInboundAt: new Date(Date.now() - 25 * HOUR) } });
    expect(await svc.getCsWindowOpen(conversation.id)).toBe(false);
  });
});

describe('ConversationService.getConversationHistory', () => {
  it('returns inbound + outbound interleaved chronologically with drafter-friendly roles', async () => {
    const contactId = await makeContact();
    const { conversation } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'customer one' });
    await sleep(15);
    await svc.recordAutoReply({ conversationId: conversation.id, body: 'bot answer', subKind: 'rag_answer' });
    await sleep(15);
    await svc.recordOperatorReply(conversation.id, 'operator answer', randomUUID());
    await sleep(15);
    await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'customer two' });

    const history = await svc.getConversationHistory(conversation.id);

    expect(history).toEqual([
      { role: 'customer', body: 'customer one' },
      { role: 'bot', body: 'bot answer' },
      { role: 'operator', body: 'operator answer' },
      { role: 'customer', body: 'customer two' },
    ]);
  });
});

describe('ConversationService.close', () => {
  it('resolves the conversation, writes a pending capture row, and enqueues the capture job', async () => {
    const contactId = await makeContact();
    const { conversation } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });
    await svc.recordOperatorReply(conversation.id, 'sorted for you', randomUUID());
    const userId = randomUUID();

    const result = await svc.close({
      conversationId: conversation.id,
      userId,
      disposition: 'SAVE_DRAFT',
      resolutionNotes: 'done',
      editedAnswer: 'cleaned answer',
    });

    expect(result.conversation.state).toBe('RESOLVED');
    expect(result.conversation.closedAt).not.toBeNull();
    expect(result.conversation.closedByUserId).toBe(userId);

    const capture = await prisma.resolutionCapture.findUniqueOrThrow({ where: { conversationId: conversation.id } });
    expect(capture.id).toBe(result.captureId);
    expect(capture.status).toBe('pending');
    expect(capture.disposition).toBe('SAVE_DRAFT');
    expect(capture.closedByUserId).toBe(userId);
    expect(capture.resolutionNotes).toBe('done');
    expect(capture.editedAnswer).toBe('cleaned answer');

    expect(queue.add).toHaveBeenCalledTimes(1);
    const [, payload] = queue.add.mock.calls[0];
    expect(payload).toMatchObject({ captureId: result.captureId });
  });

  it('throws ConflictException(NO_OPERATOR_REPLY) for a non-SKIP disposition with no operator reply', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });
    await svc.recordEscalation({ conversationId: conversation.id, inboundMessageId: inboundMessage.id, draftData, citations: [] }); // → ESCALATED, no operator reply

    await expect(
      svc.close({ conversationId: conversation.id, userId: randomUUID(), disposition: 'IMPORT_LIVE' }),
    ).rejects.toMatchObject({ response: { code: 'NO_OPERATOR_REPLY' } });

    const capture = await prisma.resolutionCapture.findUnique({ where: { conversationId: conversation.id } });
    expect(capture).toBeNull();
    expect(queue.add).not.toHaveBeenCalled();
    const conv = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(conv.state).toBe('ESCALATED'); // not resolved
  });

  it('allows a SKIP disposition to close without any operator reply', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });
    await svc.recordEscalation({ conversationId: conversation.id, inboundMessageId: inboundMessage.id, draftData, citations: [] }); // → ESCALATED

    const result = await svc.close({ conversationId: conversation.id, userId: randomUUID(), disposition: 'SKIP' });

    expect(result.conversation.state).toBe('RESOLVED');
    const capture = await prisma.resolutionCapture.findUniqueOrThrow({ where: { conversationId: conversation.id } });
    expect(capture.disposition).toBe('SKIP');
    expect(capture.status).toBe('pending');
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it('refuses to close a NEW conversation', async () => {
    const contactId = await makeContact();
    const { conversation } = await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'q' });

    await expect(
      svc.close({ conversationId: conversation.id, userId: randomUUID(), disposition: 'SKIP' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(queue.add).not.toHaveBeenCalled();
  });
});

describe('ConversationService.hasActivityAfterInbound', () => {
  it('is false when the inbound is the latest thing in the conversation', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({
      contactId,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'only message',
    });

    expect(await svc.hasActivityAfterInbound(conversation.id, inboundMessage.id)).toBe(false);
  });

  it('is true once the bot has replied after the inbound (intervening outbound)', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({
      contactId,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'question A',
    });
    await sleep(5);
    await svc.recordAutoReply({ conversationId: conversation.id, body: 'answer A', subKind: 'rag_answer' });

    expect(await svc.hasActivityAfterInbound(conversation.id, inboundMessage.id)).toBe(true);
  });

  it('is true once a newer inbound has arrived (intervening question)', async () => {
    const contactId = await makeContact();
    const { conversation, inboundMessage } = await svc.handleInbound({
      contactId,
      metaMessageId: `wamid-${randomUUID()}`,
      body: 'question A',
    });
    await sleep(5);
    await svc.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'question B' });

    expect(await svc.hasActivityAfterInbound(conversation.id, inboundMessage.id)).toBe(true);
  });
});
