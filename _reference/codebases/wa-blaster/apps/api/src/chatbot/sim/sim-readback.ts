import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotSettingsService } from '../settings/chatbot-settings.service';
import type { ChatbotInboundPayload } from '../chatbot.service';

export type DerivedSubKind =
  | 'rag_answer'
  | 'consent_offer'
  | 'still_being_processed'
  | 'escalation_declined_ack'
  | 'consent_accepted_escalate'
  | 'safety_escalate'
  | 'ignore_disabled'
  | 'ignore_opted_out'
  | 'ignore_stale'
  | 'ignore_llm_unavailable'
  | 'ignore_embeddings_unavailable'
  | 'unknown';

export function deriveSubKind(kind: string, reason: string): DerivedSubKind {
  if (kind === 'IGNORE') {
    if (reason === 'opted_out') return 'ignore_opted_out';
    if (reason === 'stale_redelivery') return 'ignore_stale';
    if (reason === 'llm_unavailable') return 'ignore_llm_unavailable';
    if (reason === 'embeddings_unavailable') return 'ignore_embeddings_unavailable';
    return 'ignore_disabled';
  }
  if (kind === 'AUTO_SEND') {
    if (reason === 'approved') return 'rag_answer';
    if (reason.startsWith('escalation_offer_sent')) return 'consent_offer';
    if (reason.startsWith('pending_escalation_still_processing')) return 'still_being_processed';
    if (reason === 'escalation_declined') return 'escalation_declined_ack';
    return 'unknown';
  }
  if (reason === 'escalation_accepted') return 'consent_accepted_escalate';
  return 'safety_escalate';
}

export interface SimResult {
  phoneE164: string;
  text: string;
  kind: string;
  subKind: DerivedSubKind;
  reason: string;
  intent: string | null;
  intentConfidence: number | null;
  draftConfidence: number | null;
  modelUsed: string | null;
  embeddingModelUsed: string | null;
  chunksRetrieved: number;
  topChunkScore: number | null;
  totalLatencyMs: number;
  retrievalLatencyMs: number | null;
  customerReply: string | null;
  operatorDraft: string | null;
  citations: Array<{ documentTitle: string; category: string; similarityScore: number; rank: number }>;
}

export function normalizeToE164(phoneInput: string): string {
  return '+' + phoneInput.replace(/\D/g, '');
}

/** Make sure the engine will actually run: chatbot enabled, kill switch off, contact opted in.
 *  optInSource is set only on CREATE so pointing the sim at a real seeded dealer never overwrites theirs. */
export async function ensureSimContact(
  prisma: PrismaService,
  settings: ChatbotSettingsService,
  phoneE164: string,
): Promise<void> {
  await settings.patch('enabled', true);
  await settings.patch('disable_auto_reply', false);
  await settings.reload();
  const last4 = phoneE164.replace(/\D/g, '').slice(-4);
  await prisma.contact.upsert({
    where: { phoneE164 },
    update: { optInStatus: 'OPTED_IN' },
    create: { phoneE164, name: `Sim ${last4}`, optInStatus: 'OPTED_IN', optInSource: 'simulator' },
  });
}

export function buildSimPayload(phoneE164: string, text: string, seq: number): ChatbotInboundPayload {
  const digits = phoneE164.replace(/\D/g, '');
  return {
    contacts: [{ wa_id: digits, profile: { name: `Sim ${digits.slice(-4)}` } }],
    message: {
      from: digits,
      id: `wamid.sim-${Date.now()}-${seq}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'text',
      text: { body: text },
    },
  };
}

/** Reconstruct the decision view from the rows handleInbound just wrote for this contact. */
export async function readBackSimResult(
  prisma: PrismaService,
  phoneE164: string,
  text: string,
): Promise<SimResult> {
  const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneE164 } });
  const conversation = await prisma.conversation.findFirst({
    where: { contactId: contact.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!conversation) {
    throw new Error(`No conversation found for ${phoneE164} after handleInbound`);
  }

  const decision = await prisma.chatbotDecision.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!decision) {
    throw new Error(`No decision recorded for ${phoneE164} — was the inbound ignored before the engine ran?`);
  }

  const lastOutbound = await prisma.conversationOutboundMessage.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
  });
  const lastDraft = await prisma.botDraft.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    include: { citations: { include: { chunk: { include: { document: true } } } } },
  });

  return {
    phoneE164,
    text,
    kind: decision.kind,
    subKind: deriveSubKind(decision.kind, decision.reason),
    reason: decision.reason,
    intent: decision.intent,
    intentConfidence: decision.intentConfidence,
    draftConfidence: decision.draftConfidence,
    modelUsed: decision.modelUsed,
    embeddingModelUsed: decision.embeddingModelUsed,
    chunksRetrieved: decision.chunksRetrieved,
    topChunkScore: decision.topChunkScore,
    totalLatencyMs: decision.totalLatencyMs,
    retrievalLatencyMs: decision.retrievalLatencyMs,
    customerReply: lastOutbound?.body ?? null,
    operatorDraft: lastDraft && lastDraft.state === 'PENDING' ? lastDraft.body : null,
    citations: (lastDraft?.citations ?? [])
      .map((c) => ({
        documentTitle: c.chunk.document.title,
        category: c.chunk.document.category,
        similarityScore: c.similarityScore,
        rank: c.rank,
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}
