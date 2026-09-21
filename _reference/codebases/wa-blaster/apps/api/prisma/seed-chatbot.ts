import { PrismaClient, Prisma } from '@prisma/client';

/** Rough word count for seeded knowledge documents. */
function wc(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Seeds chatbot-related data: settings, demo knowledge documents, and one demo
 * conversation per ConversationState so the dashboard has data to render.
 *
 * Idempotent:
 *  - settings are upserted by key
 *  - demo knowledge documents are only inserted when no KnowledgeDocument exists
 *  - demo conversations are only inserted when no Conversation exists
 */
export async function seedChatbot(prisma: PrismaClient): Promise<void> {
  // ---------------------------------------------------------------------------
  // 1. Chatbot settings (idempotent by key)
  // ---------------------------------------------------------------------------
  const settings: Array<{
    key: string;
    value: string;
    valueType: 'boolean' | 'number' | 'string';
    description: string;
  }> = [
    { key: 'enabled', value: 'false', valueType: 'boolean', description: 'Master switch for the chatbot.' },
    { key: 'disable_auto_reply', value: 'false', valueType: 'boolean', description: 'When true, the bot drafts but never auto-sends.' },
    { key: 'confidence_threshold', value: '0.85', valueType: 'number', description: 'Minimum draft confidence required to auto-send.' },
    { key: 'business_hours_start', value: '09:00', valueType: 'string', description: 'Start of business hours (local time).' },
    { key: 'business_hours_end', value: '18:00', valueType: 'string', description: 'End of business hours (local time).' },
    { key: 'business_hours_timezone', value: 'Asia/Kuala_Lumpur', valueType: 'string', description: 'IANA timezone for business hours.' },
    { key: 'business_days', value: 'MON,TUE,WED,THU,FRI', valueType: 'string', description: 'Comma-separated business days.' },
    { key: 'escalation_phone', value: process.env.CHATBOT_ESCALATION_PHONE ?? '', valueType: 'string', description: 'Phone number used for human escalation.' },
    { key: 'retrieval_top_k', value: '5', valueType: 'number', description: 'Number of knowledge chunks to retrieve per query.' },
    { key: 'retrieval_min_score', value: '0.5', valueType: 'number', description: 'Minimum cosine similarity for a retrieved chunk to count.' },
  ];

  await prisma.$transaction(
    settings.map((s) =>
      prisma.chatbotSetting.upsert({
        where: { key: s.key },
        // Do not overwrite an operator's edited value on re-seed; only ensure the row exists.
        update: { valueType: s.valueType, description: s.description },
        create: { key: s.key, value: s.value, valueType: s.valueType, description: s.description },
      }),
    ),
  );
  console.log(`Seeded ${settings.length} chatbot setting(s).`);

  // Admin user (created by the base seed) is the author/closer for seeded rows.
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) {
    console.log('No admin user found — skipping chatbot demo documents and conversations.');
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Demo knowledge documents (DRAFT) — only when none exist yet
  // ---------------------------------------------------------------------------
  const docCount = await prisma.knowledgeDocument.count();
  if (docCount === 0) {
    const shipping = `# Shipping Rates

| Zone | Areas | Standard (3-5 days) | Express (1-2 days) |
| ---- | ----- | ------------------- | ------------------ |
| West Malaysia | Selangor, KL, Penang, Johor | RM 8 | RM 15 |
| East Malaysia | Sabah, Sarawak, Labuan | RM 18 | RM 30 |
| Singapore | All areas | RM 25 | RM 45 |

Free standard shipping on orders above RM 150 (West Malaysia only).
Orders placed before 2pm on a business day ship the same day.`;

    const refund = `# Refund Policy

We offer a full refund within 14 days of delivery for unopened items in their
original packaging. To request a refund, reply with your order number and the
reason for return.

Refunds are processed within 5-7 business days to the original payment method.
Shipping fees are non-refundable unless the return is due to our error (a wrong
or damaged item). Sale and clearance items are final and cannot be refunded.`;

    const hours = `# Operating Hours

Our customer support team is available:

- Monday to Friday: 9:00am - 6:00pm (MYT)
- Saturday, Sunday and public holidays: Closed

Messages received outside business hours are answered on the next working day.

## 2026 Public Holidays (selected)

- 1 Jan - New Year's Day
- 1 Feb - Federal Territory Day
- 1 May - Labour Day
- 31 Aug - Merdeka Day`;

    await prisma.$transaction([
      prisma.knowledgeDocument.create({
        data: {
          name: 'shipping_table.md',
          title: 'Shipping Rates',
          category: 'Logistics',
          contentMd: shipping,
          wordCount: wc(shipping),
          status: 'DRAFT',
          embeddingModel: '',
          createdById: admin.id,
        },
      }),
      prisma.knowledgeDocument.create({
        data: {
          name: 'refund_policy.md',
          title: 'Refund Policy',
          category: 'Billing',
          contentMd: refund,
          wordCount: wc(refund),
          status: 'DRAFT',
          embeddingModel: '',
          createdById: admin.id,
        },
      }),
      prisma.knowledgeDocument.create({
        data: {
          name: 'operating_hours.md',
          title: 'Operating Hours',
          category: 'General',
          contentMd: hours,
          wordCount: wc(hours),
          status: 'DRAFT',
          embeddingModel: '',
          createdById: admin.id,
        },
      }),
    ]);
    console.log('Seeded 3 demo knowledge document(s) (DRAFT).');
  } else {
    console.log('Knowledge documents already exist — skipping demo documents.');
  }

  // ---------------------------------------------------------------------------
  // 3. Demo conversations — one per ConversationState — only when none exist
  // ---------------------------------------------------------------------------
  const convCount = await prisma.conversation.count();
  if (convCount > 0) {
    console.log('Conversations already exist — skipping demo conversations.');
    return;
  }

  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'asc' } });
  if (contacts.length === 0) {
    console.log('No contacts found — skipping demo conversations.');
    return;
  }

  const now = new Date();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60_000);

  // Build a fake inbound Meta payload for a contact.
  const rawInbound = (phone: string, metaId: string, body: string): Prisma.InputJsonValue => ({
    from: phone.replace('+', ''),
    id: metaId,
    timestamp: String(Math.floor(minutesAgo(10).getTime() / 1000)),
    type: 'text',
    text: { body },
  });

  type DraftSpec = { state: 'PENDING' | 'SENT'; intent: string };
  type Spec = {
    state: 'NEW' | 'AUTO_REPLIED' | 'ESCALATION_OFFERED' | 'ESCALATED' | 'AWAITING_REPLY' | 'REPLIED' | 'RESOLVED';
    language: 'EN' | 'MS' | 'ZH' | 'TA';
    inboundBody: string;
    autoReply?: string;
    operatorReply?: string;
    consentOffer?: string;
    draft?: DraftSpec;
    resolved?: { docTitle: string; docBody: string; answer: string };
  };

  const consentText =
    'It looks like this needs a bit more help. Would you like me to connect you with a member of our team? Reply YES and I will transfer you to a human agent.';

  const specs: Spec[] = [
    {
      state: 'NEW',
      language: 'EN',
      inboundBody: 'Hi, do you ship to Penang and how much is it?',
    },
    {
      state: 'AUTO_REPLIED',
      language: 'EN',
      inboundBody: 'What are your operating hours?',
      autoReply: 'We are open Monday to Friday, 9:00am to 6:00pm (MYT). Messages outside these hours are answered the next working day.',
    },
    {
      state: 'ESCALATION_OFFERED',
      language: 'EN',
      inboundBody: 'My order #10293 arrived damaged and I want a replacement urgently.',
      consentOffer: consentText,
    },
    {
      state: 'ESCALATED',
      language: 'MS',
      inboundBody: 'Saya nak tukar alamat penghantaran untuk pesanan saya, boleh tak?',
      draft: { state: 'PENDING', intent: 'change_delivery_address' },
    },
    {
      state: 'AWAITING_REPLY',
      language: 'EN',
      inboundBody: 'Can I get a refund for an item I bought last week?',
      draft: { state: 'SENT', intent: 'refund_request' },
    },
    {
      state: 'REPLIED',
      language: 'EN',
      inboundBody: 'Is the free shipping promo still running?',
      operatorReply: 'Yes! Free standard shipping applies to West Malaysia orders above RM 150. Let me know if you would like a hand placing an order.',
    },
    {
      state: 'RESOLVED',
      language: 'EN',
      inboundBody: 'How do I change the delivery address on an order I already placed?',
      operatorReply: 'No problem — as long as the order has not shipped, reply with your order number and the new address and we will update it for you.',
      resolved: {
        docTitle: 'How to change the delivery address on an existing order',
        answer: 'If the order has not yet shipped, send us your order number and the new delivery address and our team will update it before dispatch.',
        docBody: '',
      },
    },
  ];

  await prisma.$transaction(
    async (tx) => {
      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const contact = contacts[i % contacts.length];
        const inboundReceivedAt = minutesAgo(10);

        const conversation = await tx.conversation.create({
          data: {
            contactId: contact.id,
            state: spec.state,
            detectedLanguage: spec.language,
            lastInboundAt: inboundReceivedAt,
            csWindowExpiresAt: hoursFromNow(24),
            ...(spec.state === 'ESCALATED' ? { assignedToId: admin.id } : {}),
          },
        });

        const metaId = `seed-inbound-${spec.state.toLowerCase()}-${i}`;
        const inbound = await tx.conversationInboundMessage.create({
          data: {
            conversationId: conversation.id,
            metaMessageId: metaId,
            body: spec.inboundBody,
            receivedAt: inboundReceivedAt,
            rawJson: rawInbound(contact.phoneE164, metaId, spec.inboundBody),
          },
        });

        // Auto-reply outbound (AUTO_REPLIED)
        if (spec.autoReply) {
          await tx.conversationOutboundMessage.create({
            data: {
              conversationId: conversation.id,
              body: spec.autoReply,
              kind: 'AUTO_REPLY',
              sentAt: minutesAgo(9),
            },
          });
          await tx.conversation.update({ where: { id: conversation.id }, data: { lastOutboundAt: minutesAgo(9) } });
        }

        // Canned consent offer (ESCALATION_OFFERED)
        if (spec.consentOffer) {
          await tx.conversationOutboundMessage.create({
            data: {
              conversationId: conversation.id,
              body: spec.consentOffer,
              kind: 'AUTO_REPLY',
              sentAt: minutesAgo(5),
            },
          });
          await tx.conversation.update({
            where: { id: conversation.id },
            data: {
              lastOutboundAt: minutesAgo(5),
              escalationOfferedAt: minutesAgo(5),
              escalationOfferInboundId: inbound.id,
            },
          });
        }

        // Bot draft (ESCALATED, AWAITING_REPLY)
        if (spec.draft) {
          await tx.botDraft.create({
            data: {
              conversationId: conversation.id,
              inboundMessageId: inbound.id,
              body:
                spec.draft.intent === 'refund_request'
                  ? 'You can request a refund within 14 days of delivery for unopened items. Reply with your order number and the reason for return and we will start the process.'
                  : 'Sure — as long as your order has not shipped yet, reply with your order number and the new delivery address and we will update it.',
              intent: spec.draft.intent,
              intentConfidence: 0.92,
              draftConfidence: spec.draft.state === 'SENT' ? 0.88 : 0.71,
              modelUsed: 'claude-haiku-4-5',
              embeddingModelUsed: 'voyage-3',
              latencyMs: 1240,
              state: spec.draft.state,
              ...(spec.draft.state === 'SENT' ? { approvedByUserId: admin.id } : {}),
            },
          });
          if (spec.draft.state === 'SENT') {
            await tx.conversation.update({ where: { id: conversation.id }, data: { lastOutboundAt: minutesAgo(6) } });
          }
        }

        // Operator reply (REPLIED, RESOLVED)
        if (spec.operatorReply) {
          await tx.conversationOutboundMessage.create({
            data: {
              conversationId: conversation.id,
              body: spec.operatorReply,
              kind: 'OPERATOR_REPLY',
              sentByUserId: admin.id,
              sentAt: minutesAgo(4),
            },
          });
          await tx.conversation.update({ where: { id: conversation.id }, data: { lastOutboundAt: minutesAgo(4) } });
        }

        // Resolution capture + captured DRAFT document (RESOLVED)
        if (spec.state === 'RESOLVED' && spec.resolved) {
          const closedAt = minutesAgo(2);
          await tx.conversation.update({
            where: { id: conversation.id },
            data: { closedAt, closedByUserId: admin.id },
          });

          const docBody =
            spec.resolved.docBody ||
            `# ${spec.resolved.docTitle}\n\n**Question:** ${spec.inboundBody}\n\n**Answer:** ${spec.resolved.answer}`;
          const capturedDoc = await tx.knowledgeDocument.create({
            data: {
              name: `resolved_ticket_${conversation.id}.md`,
              title: spec.resolved.docTitle,
              category: 'Resolved tickets',
              contentMd: docBody,
              wordCount: wc(docBody),
              status: 'DRAFT',
              embeddingModel: '',
              capturedFromConversationId: conversation.id,
              createdById: admin.id,
            },
          });

          await tx.resolutionCapture.create({
            data: {
              conversationId: conversation.id,
              closedByUserId: admin.id,
              closedAt,
              disposition: 'SAVE_DRAFT',
              resolutionNotes: 'Resolved by operator; captured as a draft for review before publishing.',
              editedAnswer: spec.resolved.answer,
              documentId: capturedDoc.id,
              status: 'captured_draft',
            },
          });
        }
      }
    },
    { timeout: 30_000 },
  );

  console.log(`Seeded ${specs.length} demo conversation(s) (one per state).`);
}
