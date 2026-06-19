import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BlastLanguageMode, LanguagePreference, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildStateLanguagePlan } from './resolve-contact-languages';
import { StateLanguageMappingService } from '../state-language-mapping/state-language-mapping.service';
import { filterToWhere } from '../segments/filter-to-where';
import { ContactFilter } from '../segments/dto/contact-filter.dto';
import { CreateBlastDto } from './dto/create-blast.dto';
import { ListBlastsDto } from './dto/list-blasts.dto';
import { ListBlastMessagesDto } from './dto/list-blast-messages.dto';
import { PreviewStateLanguagesDto } from './dto/preview-state-languages.dto';
import { MetaInboundMessage, MetaMessageStatusEvent } from '../whatsapp/dto/meta-message-event.dto';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { attributeReply, AttributableMessage } from './reply-attribution';
import { InboxService } from '../inbox/inbox.service';
import { selectUsableTemplateRows } from './select-usable-template-rows';

export const BLAST_QUEUE = 'blast-send';

export interface BlastJobData {
  messageId: string;
}

@Injectable()
export class BlastsService {
  private readonly logger = new Logger(BlastsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(BLAST_QUEUE) private readonly queue: Queue<BlastJobData>,
    private readonly settings: SystemSettingsService,
    private readonly inboxService: InboxService,
    private readonly stateMappings: StateLanguageMappingService,
  ) {}

  list(q: ListBlastsDto) {
    const where: Prisma.BlastWhereInput = {};
    if (q.status?.length) where.status = { in: q.status };
    return this.prisma.blast.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const blast = await this.prisma.blast.findUnique({ where: { id } });
    if (!blast) throw new NotFoundException();
    return blast;
  }

  /** Per-status counts for live polling. */
  async stats(id: string) {
    const blast = await this.findOne(id);
    const grouped = await this.prisma.message.groupBy({
      by: ['status'],
      where: { blastId: id },
      _count: { status: true },
    });
    const counts: Record<string, number> = { QUEUED: 0, SENT: 0, DELIVERED: 0, READ: 0, FAILED: 0, CANCELED: 0 };
    for (const g of grouped) counts[g.status] = g._count.status;

    const replied = await this.prisma.message.count({
      where: { blastId: id, repliedAt: { not: null } },
    });

    return {
      id: blast.id,
      status: blast.status,
      totalRecipients: blast.totalRecipients,
      counts,
      replied,
      startedAt: blast.startedAt,
      completedAt: blast.completedAt,
    };
  }

  async listMessages(id: string, dto: ListBlastMessagesDto) {
    await this.findOne(id); // 404 if missing
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 25;
    const where: Prisma.MessageWhereInput = {
      blastId: id,
      ...(dto.status ? { status: dto.status } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        orderBy: [{ sentAt: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, contactId: true, status: true, errorCode: true, errorMessage: true,
          sentAt: true, deliveredAt: true, readAt: true, repliedAt: true,
        },
      }),
    ]);
    const contactIds = [...new Set(rows.map((r) => r.contactId))];
    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, name: true, phoneE164: true },
    });
    const cmap = new Map(contacts.map((c) => [c.id, c]));
    const items = rows.map((r) => {
      const c = cmap.get(r.contactId);
      return {
        id: r.id,
        contactName: c?.name ?? null,
        contactPhone: c?.phoneE164 ?? '',
        status: r.status,
        errorCode: r.errorCode,
        errorMessage: r.errorMessage,
        sentAt: r.sentAt,
        deliveredAt: r.deliveredAt,
        readAt: r.readAt,
        repliedAt: r.repliedAt,
      };
    });
    return { items, total, page, pageSize };
  }

  async retryMessage(blastId: string, messageId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.blastId !== blastId) throw new NotFoundException();
    if (msg.status !== 'FAILED') throw new BadRequestException('Only failed messages can be retried');
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null },
    });
    await this.queue.add(
      BLAST_QUEUE,
      { messageId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
    return updated;
  }

  async retryFailed(blastId: string) {
    await this.findOne(blastId); // 404 if missing
    const failed = await this.prisma.message.findMany({
      where: { blastId, status: 'FAILED' },
      select: { id: true },
    });
    if (failed.length === 0) return { retried: 0 };
    await this.prisma.message.updateMany({
      where: { blastId, status: 'FAILED' },
      data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null },
    });
    for (const m of failed) {
      await this.queue.add(
        BLAST_QUEUE,
        { messageId: m.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    }
    return { retried: failed.length };
  }

  async resolveRecipients(
    segmentId: string | undefined,
    audienceFilter?: ContactFilter,
  ): Promise<string[]> {
    // Precedence 1: saved segment
    if (segmentId) {
      const segment = await this.prisma.contactSegment.findUnique({ where: { id: segmentId } });
      if (!segment) throw new BadRequestException('Unknown segment');
      const filter = segment.filterJson as unknown as ContactFilter;
      const where = filterToWhere(filter);
      const rows = await this.prisma.contact.findMany({
        where: { ...where, optInStatus: 'OPTED_IN' },
        select: { id: true },
      });
      return rows.map((r) => r.id);
    }

    // Precedence 2: inline audience filter — always enforce blast-eligibility
    if (audienceFilter) {
      const filterWhere = filterToWhere(audienceFilter);
      // Enforce blast-eligibility unconditionally — override whatever the caller passed for
      // optInStatus/numberType so opted-out contacts and fax/lane lines are never included.
      const where = { ...filterWhere, optInStatus: 'OPTED_IN' as const, numberType: 'PHONE' as const };
      const rows = await this.prisma.contact.findMany({ where, select: { id: true } });
      return rows.map((r) => r.id);
    }

    // Precedence 3: fallback — all opted-in contacts
    const all = await this.prisma.contact.findMany({
      where: { optInStatus: 'OPTED_IN' },
      select: { id: true },
    });
    return all.map((c) => c.id);
  }

  /**
   * Resolve the rows a blast may send with. APPROVED normally; PENDING is allowed
   * only when scheduledAt is in the future (the worker re-checks approval at send time).
   */
  private async validateTemplate(templateName: string, defaultLanguage: string, scheduledAt: Date) {
    const rows = await this.prisma.template.findMany({ where: { name: templateName } });
    if (rows.length === 0) throw new BadRequestException(`Template "${templateName}" not found`);
    return selectUsableTemplateRows(rows, defaultLanguage, scheduledAt.getTime() > Date.now());
  }

  async previewStateLanguages(dto: PreviewStateLanguagesDto) {
    const { usableRows } = await this.validateTemplate(dto.templateName, dto.defaultLanguage, new Date());
    const approvedByLang = new Map(usableRows.map((r) => [r.language, r]));
    const contactIds = await this.resolveRecipients(dto.segmentId, dto.audienceFilter);
    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, state: true },
    });
    const mapping = await this.stateMappings.asMap();
    const defaultLanguage = dto.defaultLanguage as LanguagePreference;

    const plan = buildStateLanguagePlan(contacts, mapping, defaultLanguage, approvedByLang);

    return {
      uniqueContacts: plan.uniqueContacts,
      totalMessages: plan.totalMessages,
      byLanguage: plan.byLanguage,
      byState: plan.byState,
      gaps: plan.gaps.map((g) => ({ ...g, templateName: dto.templateName })),
    };
  }

  async createAndSchedule(dto: CreateBlastDto, actorUserId: string) {
    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Invalid scheduledAt');

    const { usableRows } = await this.validateTemplate(dto.templateName, dto.defaultLanguage, scheduledAt);

    const contactIds = await this.resolveRecipients(dto.segmentId, dto.audienceFilter);
    if (contactIds.length === 0) throw new BadRequestException('Segment resolved to 0 contacts');

    const approvedByLang = new Map(usableRows.map((r) => [r.language, r]));
    const mode = dto.languageMode ?? BlastLanguageMode.PREFERENCE;

    let messageSpecs: { contactId: string; templateId: string }[];

    if (mode === BlastLanguageMode.STATE) {
      const contacts = await this.prisma.contact.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, state: true },
      });
      const mapping = await this.stateMappings.asMap();
      const defaultLanguage = dto.defaultLanguage as LanguagePreference;

      // Single source of truth shared with previewStateLanguages — counts and gap
      // detection can never diverge between preview and actual send.
      const plan = buildStateLanguagePlan(contacts, mapping, defaultLanguage, approvedByLang);

      // Validate variant coverage up front, before any write.
      if (plan.gaps.length > 0) {
        throw new BadRequestException({
          error: 'missing_template_variants',
          message: `State-based blast needs languages with no approved template variant: ${plan.gaps
            .map((g) => g.language)
            .join(', ')}.`,
          gaps: plan.gaps.map((g) => ({ ...g, templateName: dto.templateName })),
        });
      }

      messageSpecs = plan.messageSpecs;
    } else {
      const contacts = await this.prisma.contact.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, languagePreference: true },
      });
      const fallback = approvedByLang.get(dto.defaultLanguage)!;
      messageSpecs = contacts.map((c) => {
        const picked = approvedByLang.get(c.languagePreference) ?? fallback;
        return { contactId: c.id, templateId: picked.id };
      });
    }

    const blast = await this.prisma.blast.create({
      data: {
        name: dto.name,
        templateName: dto.templateName,
        defaultLanguage: dto.defaultLanguage,
        segmentId: dto.segmentId ?? null,
        recipientSnapshot: contactIds as unknown as Prisma.InputJsonValue,
        variableMapping: dto.variableMapping as Prisma.InputJsonValue,
        scheduledAt,
        status: 'SCHEDULED',
        languageMode: mode,
        uniqueContacts: contactIds.length,
        totalRecipients: messageSpecs.length,
        createdById: actorUserId,
      },
    });

    await this.prisma.$transaction(
      messageSpecs.map((spec) =>
        this.prisma.message.create({
          data: {
            blastId: blast.id,
            contactId: spec.contactId,
            templateId: spec.templateId,
            status: 'QUEUED',
          },
        }),
      ),
    );

    const newMessages = await this.prisma.message.findMany({
      where: { blastId: blast.id },
      select: { id: true },
    });
    const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
    for (const m of newMessages) {
      await this.queue.add(
        BLAST_QUEUE,
        { messageId: m.id },
        { delay: delayMs, attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
      );
    }
    this.logger.log(`Blast ${blast.id} scheduled with ${newMessages.length} jobs (mode=${mode}), delay=${delayMs}ms`);
    return blast;
  }

  async cancel(id: string) {
    const blast = await this.findOne(id);
    if (!['SCHEDULED', 'RUNNING'].includes(blast.status)) {
      throw new BadRequestException(`Cannot cancel a ${blast.status} blast`);
    }

    // Remove delayed/waiting jobs for this blast
    const jobs = await this.queue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      const data = job.data as BlastJobData;
      const msg = await this.prisma.message.findUnique({ where: { id: data.messageId } });
      if (msg?.blastId === id) {
        await job.remove();
      }
    }

    await this.prisma.message.updateMany({
      where: { blastId: id, status: 'QUEUED' },
      data: { status: 'CANCELED' },
    });
    return this.prisma.blast.update({
      where: { id },
      data: { status: 'CANCELED', completedAt: new Date() },
    });
  }

  async applyMetaMessageEvent(status: MetaMessageStatusEvent): Promise<void> {
    const message = await this.prisma.message.findUnique({ where: { metaMessageId: status.id } });
    if (!message) {
      this.logger.warn(`Webhook for unknown meta_message_id=${status.id}`);
      return;
    }

    const map: Record<string, 'DELIVERED' | 'READ' | 'FAILED'> = {
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    };
    const newStatus = map[status.status];
    if (!newStatus) return; // ignore "sent" (we already set SENT locally)

    const data: Prisma.MessageUpdateInput = { status: newStatus };
    if (newStatus === 'DELIVERED') data.deliveredAt = new Date();
    if (newStatus === 'READ') data.readAt = new Date();
    if (newStatus === 'FAILED' && status.errors?.length) {
      data.errorCode = String(status.errors[0].code);
      data.errorMessage = status.errors[0].title;
    }

    await this.prisma.message.update({ where: { id: message.id }, data });

    // Persist raw event for the audit trail
    await this.prisma.messageEvent.create({
      data: {
        messageId: message.id,
        metaEventType: status.status,
        payloadJson: status as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async applyInboundMessage(
    inbound: MetaInboundMessage,
  ): Promise<{ contactId: string; inboundMessageId: string; body: string } | null> {
    // Look up the contact by phone (Meta sends "60198765432", we store "+60198765432")
    const phoneE164 = inbound.from.startsWith('+') ? inbound.from : `+${inbound.from}`;
    let contact = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (!contact) {
      // Unknown sender — store as a contact-less inbound for audit and bail
      this.logger.warn(`Inbound from unknown number ${phoneE164} — storing anyway`);
      contact = await this.prisma.contact.create({
        data: {
          phoneE164,
          name: null,
          optInStatus: 'PENDING',
          optInSource: 'inbound:auto-created',
          attributes: {},
        },
      });
    }

    // De-dupe — Meta sometimes redelivers
    const existing = await this.prisma.inboundMessage.findUnique({ where: { metaMessageId: inbound.id } });
    if (existing) {
      this.logger.log(`Inbound ${inbound.id} already stored — skipping`);
      return null;
    }

    // Extract a body string for storage. Text is the common case; for other types we store a placeholder
    // and rely on the audit JSON in MessageEvent for the raw payload.
    const body = this.extractInboundBody(inbound);

    // Run attribution against recent messages for this contact
    const windowDays = Number(await this.settings.get('reply_attribution_window_days', '7'));
    const candidates = await this.prisma.message.findMany({
      where: {
        contactId: contact.id,
        status: { in: ['SENT', 'DELIVERED', 'READ'] },
      },
      select: { id: true, blastId: true, status: true, sentAt: true },
      orderBy: { sentAt: 'desc' },
      take: 20, // bound the result set; attributeReply does the real filtering
    });

    const attribution = attributeReply(candidates as AttributableMessage[], new Date(), windowDays);

    const inboundMessage = await this.prisma.inboundMessage.create({
      data: {
        contactId: contact.id,
        metaMessageId: inbound.id,
        body,
        attributedBlastId: attribution?.blastId ?? null,
        routedTo: 'ANALYTICS',
      },
    });

    if (attribution) {
      // Stamp the matched message's repliedAt — but only if it isn't already stamped (first reply wins)
      await this.prisma.message.updateMany({
        where: { id: attribution.messageId, repliedAt: null },
        data: { repliedAt: new Date() },
      });
    }

    // Also persist the raw event for audit
    await this.prisma.messageEvent.create({
      data: {
        messageId: attribution?.messageId ?? null,
        metaEventType: `inbound:${inbound.type}`,
        payloadJson: inbound as unknown as Prisma.InputJsonValue,
      },
    });

    // Update the inbox conversation state so this thread surfaces in the operator inbox.
    // Errors here must not fail the webhook — the inbound message is already persisted.
    const receivedAt = new Date();
    try {
      await this.inboxService.handleInbound(contact.id, receivedAt);
    } catch (err) {
      this.logger.error('Inbox handleInbound failed; inbound message still persisted', err as Error);
    }

    return { contactId: contact.id, inboundMessageId: inboundMessage.id, body };
  }

  private extractInboundBody(inbound: MetaInboundMessage): string {
    if (inbound.text?.body) return inbound.text.body;
    if (inbound.button?.text) return `[button] ${inbound.button.text}`;
    if (inbound.interactive?.button_reply?.title) return `[button reply] ${inbound.interactive.button_reply.title}`;
    if (inbound.interactive?.list_reply?.title) return `[list reply] ${inbound.interactive.list_reply.title}`;
    return `[${inbound.type} — see payload_json for raw content]`;
  }
}
