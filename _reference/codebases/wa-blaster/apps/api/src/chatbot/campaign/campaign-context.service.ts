import { Injectable } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { attributeReply } from '../../blasts/reply-attribution';
import { renderTemplate, VariableMapping } from '../../blasts/variable-renderer';

/** A reply within this many days of a blast is treated as "about that campaign". */
export const CAMPAIGN_ATTRIBUTION_WINDOW_DAYS = 7;

export interface CampaignContext {
  blastId: string;
  campaignName: string;
  renderedText: string;
}

/**
 * Resolves which campaign an inbound message is about, and renders that campaign's exact text.
 *
 * Two-tier attribution:
 *  1. EXACT  — the inbound quote-replies a blast message (WhatsApp `context.id`) -> that campaign.
 *  2. FALLBACK — most-recent SENT/DELIVERED/READ blast within CAMPAIGN_ATTRIBUTION_WINDOW_DAYS.
 *
 * Returns null when nothing attributes (the chatbot then behaves as pure KB RAG).
 */
@Injectable()
export class CampaignContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveCampaign(input: {
    contact: Contact;
    replyToMetaMessageId?: string;
  }): Promise<CampaignContext | null> {
    const resolved = await this.resolveBlastMessage(input.contact.id, input.replyToMetaMessageId);
    if (!resolved?.templateId) return null;

    const [blast, template] = await Promise.all([
      this.prisma.blast.findUnique({ where: { id: resolved.blastId } }),
      this.prisma.template.findUnique({ where: { id: resolved.templateId } }),
    ]);
    if (!blast || !template) return null;

    const renderedText = renderTemplate(
      template.bodyText,
      (blast.variableMapping ?? {}) as VariableMapping,
      { ...input.contact, attributes: (input.contact.attributes ?? {}) as Record<string, unknown> },
    );

    return { blastId: blast.id, campaignName: blast.name, renderedText };
  }

  private async resolveBlastMessage(
    contactId: string,
    replyToMetaMessageId?: string,
  ): Promise<{ blastId: string; templateId: string | null } | null> {
    // Tier 1 — exact quote-reply match.
    if (replyToMetaMessageId) {
      const exact = await this.prisma.message.findFirst({
        where: { metaMessageId: replyToMetaMessageId, blastId: { not: null } },
        select: { blastId: true, templateId: true },
      });
      if (exact?.blastId) return { blastId: exact.blastId, templateId: exact.templateId };
    }

    // Tier 2 — most recent blast within the window.
    const candidates = await this.prisma.message.findMany({
      where: {
        contactId,
        source: 'BLAST',
        blastId: { not: null },
        status: { in: ['SENT', 'DELIVERED', 'READ'] },
      },
      orderBy: { sentAt: 'desc' },
      take: 20,
      select: { id: true, blastId: true, status: true, sentAt: true, templateId: true },
    });

    const attribution = attributeReply(
      candidates.map((c) => ({ id: c.id, blastId: c.blastId as string, status: c.status, sentAt: c.sentAt })),
      new Date(),
      CAMPAIGN_ATTRIBUTION_WINDOW_DAYS,
    );
    if (!attribution) return null;

    const picked = candidates.find((c) => c.id === attribution.messageId);
    if (!picked?.blastId) return null;
    return { blastId: picked.blastId, templateId: picked.templateId };
  }
}
