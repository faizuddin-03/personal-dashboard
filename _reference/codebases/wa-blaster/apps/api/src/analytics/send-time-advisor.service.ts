import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { klWeekdayHour, rate } from './analytics.util';
import { computeSendTimeStats } from './send-time-stats';
import {
  SendTimeAdvice,
  SendTimeAdviceResponse,
  SendTimeRecommendation,
  SendTimeThisRun,
} from './send-time-advisor.types';

const DEFAULT_LOOKBACK_DAYS = 90;
const DEFAULT_MIN_EVENTS = 30;
const CACHE_TTL_MS = 60 * 60 * 1000;
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Injectable()
export class SendTimeAdvisorService {
  private readonly cache = new Map<string, { at: number; value: SendTimeAdviceResponse }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  private num(key: string, dflt: number): number {
    const v = Number(this.config.get<string>(key));
    return Number.isFinite(v) && v > 0 ? v : dflt;
  }

  async getAdvice(blastId: string, now = new Date()): Promise<SendTimeAdviceResponse> {
    const cached = this.cache.get(blastId);
    if (cached && now.getTime() - cached.at < CACHE_TTL_MS) return cached.value;

    const blast = await this.prisma.blast.findUnique({
      where: { id: blastId },
      select: { id: true, name: true, recipientSnapshot: true, startedAt: true, scheduledAt: true },
    });
    if (!blast) throw new NotFoundException('Blast not found');

    const audience = Array.isArray(blast.recipientSnapshot) ? (blast.recipientSnapshot as string[]) : [];
    const thisRun = await this.buildThisRun(blastId, blast.startedAt ?? blast.scheduledAt ?? null);

    const minEvents = this.num('SEND_TIME_MIN_EVENTS', DEFAULT_MIN_EVENTS);
    const lookbackDays = this.num('SEND_TIME_LOOKBACK_DAYS', DEFAULT_LOOKBACK_DAYS);
    const since = new Date(now.getTime() - lookbackDays * 86_400_000);

    const events =
      audience.length === 0
        ? []
        : await this.prisma.message.findMany({
            where: {
              contactId: { in: audience },
              source: 'BLAST',
              OR: [{ readAt: { gte: since } }, { repliedAt: { gte: since } }],
            },
            select: { readAt: true, repliedAt: true },
          });

    const stats = computeSendTimeStats({ events, minEvents });
    const advice = await this.buildAdvice(blast.name, thisRun, stats.recommendation, stats.confidence);

    const value: SendTimeAdviceResponse = {
      blastId: blast.id,
      campaignName: blast.name,
      audienceSize: audience.length,
      totalEvents: stats.totalEvents,
      confidence: stats.confidence,
      recommendation: stats.recommendation,
      hourHistogram: stats.hourHistogram,
      thisRun,
      advice,
    };
    this.cache.set(blastId, { at: now.getTime(), value });
    return value;
  }

  private async buildThisRun(blastId: string, sentAt: Date | null): Promise<SendTimeThisRun> {
    const [sent, read, replied] = await Promise.all([
      this.prisma.message.count({ where: { blastId, sentAt: { not: null } } }),
      this.prisma.message.count({ where: { blastId, readAt: { not: null } } }),
      this.prisma.message.count({ where: { blastId, repliedAt: { not: null } } }),
    ]);
    const parts = sentAt ? klWeekdayHour(sentAt) : null;
    return {
      sentAt: sentAt ? sentAt.toISOString() : null,
      sentWeekday: parts ? parts.weekday : null,
      sentHour: parts ? parts.hour : null,
      sent,
      read,
      replied,
      readRate: rate(read, sent),
      replyRate: rate(replied, sent),
    };
  }

  private async buildAdvice(
    campaignName: string,
    thisRun: SendTimeThisRun,
    rec: SendTimeRecommendation | null,
    confidence: SendTimeAdviceResponse['confidence'],
  ): Promise<SendTimeAdvice> {
    if (!rec || confidence === 'INSUFFICIENT') {
      return {
        headline: 'Not enough history yet',
        body:
          "We'll recommend a better send time once this audience has received more campaigns and " +
          'we can see when they tend to read and reply.',
      };
    }
    const sentLabel =
      thisRun.sentWeekday != null && thisRun.sentHour != null
        ? `${WEEKDAY_NAMES[thisRun.sentWeekday]} ${this.formatHour(thisRun.sentHour)}`
        : null;
    return this.llm.generateSendTimeAdvice({
      campaignName,
      thisRun: { sentLabel, readRate: thisRun.readRate, replyRate: thisRun.replyRate },
      recommendation: {
        windowLabel: this.formatWindow(rec),
        share: rec.share,
        confidence: confidence as 'LOW' | 'MEDIUM' | 'HIGH',
      },
    });
  }

  private formatWindow(rec: SendTimeRecommendation): string {
    const dayPart = rec.days
      ? `${WEEKDAY_NAMES[rec.days[0]]}–${WEEKDAY_NAMES[rec.days[rec.days.length - 1]]}, `
      : '';
    return `${dayPart}${this.formatHour(rec.hourStart)}–${this.formatHour(rec.hourEnd)}`;
  }

  private formatHour(h: number): string {
    const period = h < 12 ? 'AM' : 'PM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr} ${period}`;
  }
}
