import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { ChatbotSettingsService } from '../chatbot/settings/chatbot-settings.service';
import {
  SimResult,
  normalizeToE164,
  ensureSimContact,
  buildSimPayload,
  readBackSimResult,
} from '../chatbot/sim/sim-readback';
import { renderTemplate, VariableMapping } from '../blasts/variable-renderer';

export interface SimStatus {
  simulatorEnabled: boolean;
  whatsappMock: boolean;
  llmMock: boolean;
  embeddingsMock: boolean;
  chatbotEnabled: boolean;
}

export interface ThreadItem {
  id: string;
  at: string;
  direction: 'incoming' | 'outgoing';
  kind: 'chat_inbound' | 'bot_reply' | 'operator_reply' | 'blast';
  body: string;
  meta?: { subKind?: string; status?: string; templateName?: string; language?: string };
}

export interface ThreadResponse {
  phone: string;
  contactId: string | null;
  items: ThreadItem[];
}

/**
 * Dev-only QA harness. Drives the real ChatbotService.handleInbound synchronously in the API
 * process (no worker/queue) and reads the decision back into a SimResult. Always gated by
 * SimulatorGuard at the controller — never expose these methods on an unguarded route.
 */
@Injectable()
export class SimulatorService {
  private seq = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatbot: ChatbotService,
    private readonly settings: ChatbotSettingsService,
    private readonly config: ConfigService,
  ) {}

  async simulateInbound(phone: string, text: string): Promise<SimResult> {
    const phoneE164 = normalizeToE164(phone);
    await ensureSimContact(this.prisma, this.settings, phoneE164);
    await this.chatbot.handleInbound(buildSimPayload(phoneE164, text, this.seq++));
    return readBackSimResult(this.prisma, phoneE164, text);
  }

  async reset(phone: string): Promise<{ deletedConversations: number }> {
    const phoneE164 = normalizeToE164(phone);
    const contact = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (!contact) return { deletedConversations: 0 };
    // Conversation children (inbound/outbound/botDraft/decision/capture) cascade on FK delete.
    const res = await this.prisma.conversation.deleteMany({ where: { contactId: contact.id } });
    return { deletedConversations: res.count };
  }

  async status(): Promise<SimStatus> {
    return {
      simulatorEnabled: this.config.get<string>('SIMULATOR_ENABLED', 'false') === 'true',
      whatsappMock: this.config.get<string>('WHATSAPP_MOCK_MODE', 'true') === 'true',
      llmMock: this.config.get<string>('LLM_MOCK_MODE', 'true') === 'true',
      embeddingsMock: this.config.get<string>('EMBEDDINGS_MOCK_MODE', 'true') === 'true',
      chatbotEnabled: await this.settings.get<boolean>('enabled', false),
    };
  }

  /** Unified phone timeline. direction is from the PHONE's POV:
   *  outgoing = phone→business (what QA typed); incoming = business→phone (bot/operator/blast). */
  async getThread(phone: string): Promise<ThreadResponse> {
    const phoneE164 = normalizeToE164(phone);
    const contact = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (!contact) return { phone: phoneE164, contactId: null, items: [] };

    const conversations = await this.prisma.conversation.findMany({
      where: { contactId: contact.id },
      select: { id: true },
    });
    const convIds = conversations.map((c) => c.id);

    const [inbound, outbound, messages] = await Promise.all([
      convIds.length
        ? this.prisma.conversationInboundMessage.findMany({ where: { conversationId: { in: convIds } } })
        : Promise.resolve([]),
      convIds.length
        ? this.prisma.conversationOutboundMessage.findMany({ where: { conversationId: { in: convIds } } })
        : Promise.resolve([]),
      this.prisma.message.findMany({ where: { contactId: contact.id } }),
    ]);

    const items: ThreadItem[] = [];

    for (const m of inbound) {
      items.push({ id: m.id, at: m.receivedAt.toISOString(), direction: 'outgoing', kind: 'chat_inbound', body: m.body });
    }
    for (const m of outbound) {
      items.push({
        id: m.id,
        at: (m.sentAt ?? m.createdAt).toISOString(),
        direction: 'incoming',
        kind: m.kind === 'OPERATOR_REPLY' ? 'operator_reply' : 'bot_reply',
        body: m.body,
      });
    }

    // Blast/inbox Message rows. Message has no createdAt; blast bodies are not persisted, so render
    // them on read from the language-specific Template (Message.templateId) + Blast.variableMapping.
    const templateIds = [...new Set(messages.map((m) => m.templateId).filter((x): x is string => !!x))];
    const blastIds = [...new Set(messages.map((m) => m.blastId).filter((x): x is string => !!x))];
    const [templates, blasts] = await Promise.all([
      templateIds.length ? this.prisma.template.findMany({ where: { id: { in: templateIds } } }) : Promise.resolve([]),
      blastIds.length ? this.prisma.blast.findMany({ where: { id: { in: blastIds } } }) : Promise.resolve([]),
    ]);
    const tplById = new Map(templates.map((t) => [t.id, t]));
    const blastById = new Map(blasts.map((b) => [b.id, b]));

    for (const m of messages) {
      if (m.source === 'INBOX') {
        items.push({
          id: m.id,
          at: (m.sentAt ?? new Date(0)).toISOString(),
          direction: 'incoming',
          kind: 'operator_reply',
          body: m.body ?? '',
          meta: { status: m.status },
        });
        continue;
      }
      // BLAST
      const tpl = m.templateId ? tplById.get(m.templateId) : undefined;
      const blast = m.blastId ? blastById.get(m.blastId) : undefined;
      const at = m.sentAt ?? blast?.scheduledAt ?? new Date(0);
      let body = m.body ?? '[blast template unavailable]';
      const meta: ThreadItem['meta'] = { status: m.status };
      if (tpl && blast) {
        body = renderTemplate(tpl.bodyText, blast.variableMapping as VariableMapping, contact as any);
        meta.templateName = tpl.name;
        meta.language = tpl.language;
      }
      items.push({ id: m.id, at: at.toISOString(), direction: 'incoming', kind: 'blast', body, meta });
    }

    items.sort((a, b) => a.at.localeCompare(b.at));
    return { phone: phoneE164, contactId: contact.id, items };
  }
}
