import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ResolutionCapture } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentService } from '../knowledge/document.service';
import { IngestionService } from '../knowledge/ingestion.service';
import { RetrievalService } from '../knowledge/retrieval.service';
import { ListCapturesDto } from '../dto/captures.dto';

const CAPTURE_LIST_INCLUDE = {
  document: { select: { id: true, title: true, status: true, category: true } },
  conversation: { select: { id: true, contact: { select: { name: true } } } },
} satisfies Prisma.ResolutionCaptureInclude;

const CAPTURE_DETAIL_INCLUDE = {
  document: { select: { id: true, title: true, status: true, category: true } },
  conversation: {
    select: {
      id: true,
      contact: { select: { name: true } },
      inboundMessages: { orderBy: { receivedAt: 'asc' as const }, take: 1 },
    },
  },
} satisfies Prisma.ResolutionCaptureInclude;

export interface ListCapturesResult {
  items: ResolutionCapture[];
  total: number;
  page: number;
  limit: number;
}

export interface PromoteResult {
  capture: ResolutionCapture;
  document: Awaited<ReturnType<DocumentService['publish']>>;
}

/**
 * Admin operations over the resolution captures produced when operators close tickets:
 * list/inspect, PROMOTE a captured DRAFT doc to LIVE (re-running dedup), and DISCARD
 * (archive the doc + mark the capture 'discarded').
 */
@Injectable()
export class CaptureAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentService: DocumentService,
    private readonly ingestion: IngestionService,
    private readonly retrieval: RetrievalService,
    private readonly config: ConfigService,
  ) {}

  async list(filter: ListCapturesDto): Promise<ListCapturesResult> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 20));

    const where: Prisma.ResolutionCaptureWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.disposition) where.disposition = filter.disposition;
    if (filter.from || filter.to) {
      where.closedAt = {};
      if (filter.from) where.closedAt.gte = new Date(filter.from);
      if (filter.to) where.closedAt.lte = new Date(filter.to);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.resolutionCapture.findMany({
        where,
        include: CAPTURE_LIST_INCLUDE,
        orderBy: { closedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.resolutionCapture.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async get(id: string): Promise<ResolutionCapture> {
    const capture = await this.prisma.resolutionCapture.findUnique({
      where: { id },
      include: CAPTURE_DETAIL_INCLUDE,
    });
    if (!capture) throw new NotFoundException(`Capture ${id} not found`);
    return capture;
  }

  async promote(captureId: string, opts: { forcedDespiteDuplicate?: boolean }): Promise<PromoteResult> {
    const capture = await this.prisma.resolutionCapture.findUnique({ where: { id: captureId } });
    if (!capture) throw new NotFoundException(`Capture ${captureId} not found`);
    if (!capture.documentId) {
      throw new ConflictException({ code: 'NOTHING_TO_PROMOTE', message: 'This capture has no document to promote' });
    }
    if (capture.status === 'captured_live') {
      throw new ConflictException({ code: 'ALREADY_LIVE', message: 'This capture is already live' });
    }

    // The original customer question drives the dedup check.
    const inbound = await this.prisma.conversationInboundMessage.findFirst({
      where: { conversationId: capture.conversationId },
      orderBy: { receivedAt: 'asc' },
    });
    const question = inbound?.body ?? '';

    // Re-run dedup against the LIVE KB. Retrieval only returns LIVE docs and this doc is
    // DRAFT, so it cannot self-match.
    const threshold = Number(this.config.get('CHATBOT_CAPTURE_DEDUP_THRESHOLD', 0.85));
    let topDup: { document: { id: string; title: string }; similarityScore: number } | undefined;
    if (question) {
      const result = await this.retrieval.retrieve(question, { topK: 1, minScore: threshold });
      topDup = result.chunks[0];
    }
    if (topDup && !opts.forcedDespiteDuplicate) {
      throw new ConflictException({
        code: 'DUPLICATE',
        duplicate: {
          documentId: topDup.document.id,
          documentTitle: topDup.document.title,
          similarityScore: topDup.similarityScore,
        },
      });
    }

    // Ensure the doc has chunks before publishing (DocumentService.publish requires them).
    const chunkCount = await this.prisma.knowledgeChunk.count({ where: { documentId: capture.documentId } });
    if (chunkCount === 0) {
      await this.ingestion.ingest(capture.documentId);
    }

    const document = await this.documentService.publish(capture.documentId);

    const updated = await this.prisma.resolutionCapture.update({
      where: { id: capture.id },
      data: {
        status: 'captured_live',
        forcedDespiteDuplicate: opts.forcedDespiteDuplicate ?? capture.forcedDespiteDuplicate,
        duplicateOfId: topDup && opts.forcedDespiteDuplicate ? topDup.document.id : capture.duplicateOfId,
      },
    });

    return { capture: updated, document };
  }

  async discard(captureId: string, reason?: string): Promise<ResolutionCapture> {
    const capture = await this.prisma.resolutionCapture.findUnique({ where: { id: captureId } });
    if (!capture) throw new NotFoundException(`Capture ${captureId} not found`);

    if (capture.documentId) {
      await this.prisma.knowledgeDocument.update({
        where: { id: capture.documentId },
        data: { status: 'ARCHIVED' },
      });
    }

    return this.prisma.resolutionCapture.update({
      where: { id: capture.id },
      data: {
        status: 'discarded',
        resolutionNotes: reason
          ? `${capture.resolutionNotes ?? ''}\n[discarded] ${reason}`.trim()
          : capture.resolutionNotes,
      },
    });
  }
}
