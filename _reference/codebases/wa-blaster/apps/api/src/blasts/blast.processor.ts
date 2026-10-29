import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappCloudApiService } from '../whatsapp/whatsapp-cloud-api.service';
import { RateLimiterService } from './rate-limiter.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { renderTemplate } from './variable-renderer';
import { BLAST_QUEUE, BlastJobData } from './blasts.service';

function toMetaLocale(lang: string): string {
  const map: Record<string, string> = { EN: 'en', MS: 'ms', ZH: 'zh_CN', TA: 'ta', OTHER: 'en' };
  return map[lang] ?? 'en';
}

@Processor(BLAST_QUEUE, { concurrency: 80 })
@Injectable()
export class BlastProcessor extends WorkerHost {
  private readonly logger = new Logger(BlastProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
    private readonly limiter: RateLimiterService,
    private readonly settings: SystemSettingsService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  private numEnv(key: string, fallback: number): number {
    const raw = Number(this.config.get<string>(key));
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }

  async process(job: Job<BlastJobData>): Promise<void> {
    const { messageId } = job.data;
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      this.logger.warn(`Message ${messageId} not found — skipping`);
      return;
    }
    if (message.status !== 'QUEUED') {
      this.logger.log(`Message ${messageId} status=${message.status} — skipping`);
      return;
    }
    // Blast-queued messages always have blastId + templateId (set at creation).
    // INBOX-source messages are never queued via this processor.
    if (!message.blastId || !message.templateId) {
      this.logger.error(`Message ${messageId} missing blastId/templateId — not a blast job; skipping`);
      return;
    }

    // 24h tier check
    const tier = (await this.settings.get('current_messaging_tier', 'TIER_1')) as
      | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNLIMITED';
    const cap = RateLimiterService.capFor(tier);
    const consume = await this.limiter.consume(cap);
    if (!consume.ok) {
      this.logger.warn(`Tier cap hit (${tier}=${cap}), delaying ${consume.retryAfterMs}ms`);
      await job.moveToDelayed(Date.now() + consume.retryAfterMs);
      return;
    }

    const [contact, template, blast] = await Promise.all([
      this.prisma.contact.findUnique({ where: { id: message.contactId } }),
      this.prisma.template.findUnique({ where: { id: message.templateId } }),
      this.prisma.blast.findUnique({ where: { id: message.blastId } }),
    ]);
    if (!contact || !template || !blast) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'FAILED', errorCode: 'MISSING_REFERENCE', errorMessage: 'Contact/template/blast not found' },
      });
      throw new Error('missing reference');
    }

    // Fire-time template-approval guard. A campaign may have been scheduled against a
    // still-PENDING template (assistant flow). Re-check at send time.
    if (template.status !== 'APPROVED') {
      const graceMs = this.numEnv('ASSISTANT_TEMPLATE_GRACE_MS', 24 * 60 * 60 * 1000);
      const recheckMs = this.numEnv('ASSISTANT_TEMPLATE_RECHECK_MS', 5 * 60 * 1000);
      const deadline = (blast.scheduledAt?.getTime() ?? Date.now()) + graceMs;

      if (template.status === 'REJECTED' || Date.now() > deadline) {
        await this.prisma.message.update({
          where: { id: messageId },
          data: {
            status: 'FAILED',
            errorCode: 'TEMPLATE_NOT_APPROVED',
            errorMessage: `Template ${template.name} is ${template.status} at send time`,
          },
        });
        this.logger.warn(`Message ${messageId} failed: template ${template.name} ${template.status}`);
        const remaining = await this.prisma.message.count({ where: { blastId: blast.id, status: 'QUEUED' } });
        if (remaining === 0) {
          await this.prisma.blast
            .update({ where: { id: blast.id }, data: { status: 'FAILED' } })
            .catch(() => undefined);
        }
        return;
      }

      // Within the grace window — hold and re-check later (does not consume a BullMQ attempt).
      this.logger.log(`Template ${template.name} ${template.status}; holding ${messageId} for ${recheckMs}ms`);
      await job.moveToDelayed(Date.now() + recheckMs);
      return;
    }

    // Transition blast to RUNNING on first job (idempotent — only one update happens)
    if (blast.status === 'SCHEDULED') {
      await this.prisma.blast.update({
        where: { id: blast.id, status: 'SCHEDULED' },
        data: { status: 'RUNNING', startedAt: new Date() },
      }).catch(() => undefined);
    }

    const variableNumbers = template.variables.map((_, i) => String(i + 1));
    const components = renderTemplate.toComponents(
      variableNumbers,
      blast.variableMapping as Record<string, string>,
      contact as any,
    );

    try {
      const send = await this.whatsapp.sendMessage({
        toPhoneE164: contact.phoneE164,
        templateName: template.name,
        templateLanguage: toMetaLocale(template.language),
        components,
      });

      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          metaMessageId: send.metaMessageId,
          sentAt: new Date(),
        },
      });

      // Check if any QUEUED remain; if not, mark blast COMPLETED.
      const stillQueued = await this.prisma.message.count({
        where: { blastId: blast.id, status: 'QUEUED' },
      });
      if (stillQueued === 0) {
        await this.prisma.blast.update({
          where: { id: blast.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'FAILED', errorCode: 'SEND_FAILED', errorMessage: msg },
      });
      throw err; // re-throw so BullMQ records the failure
    }
  }
}
