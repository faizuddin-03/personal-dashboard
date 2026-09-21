import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResolutionCapture } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ChunkerService } from './chunker.service';
import { RetrievalService } from './retrieval.service';
import { IngestionService } from './ingestion.service';
import { TitleGeneratorService } from './title-generator.service';

export interface CapturePreview {
  proposedTitle: string;
  /** Assembled Q + operator reply; the operator can edit this in the modal before capture. */
  proposedContentMd: string;
  duplicates: Array<{
    documentId: string;
    documentTitle: string;
    similarityScore: number;
  }>;
}

export interface CaptureInput {
  conversationId: string;
  closedByUserId: string;
  disposition: 'IMPORT_LIVE' | 'SAVE_DRAFT' | 'SKIP';
  resolutionNotes?: string;
  /** Operator's cleaned-up answer; overrides the literal operator reply in contentMd. */
  editedAnswer?: string;
  forcedDespiteDuplicate?: boolean;
}

@Injectable()
export class ResolutionCaptureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
    private readonly chunker: ChunkerService,
    private readonly retrieval: RetrievalService,
    private readonly ingestion: IngestionService,
    private readonly titleGen: TitleGeneratorService,
    private readonly config: ConfigService,
  ) {}

  async preview(input: { conversationId: string }): Promise<CapturePreview> {
    const conv = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: input.conversationId },
      include: {
        inboundMessages: { orderBy: { receivedAt: 'asc' }, take: 1 },
        outboundMessages: { where: { kind: 'OPERATOR_REPLY' }, orderBy: { sentAt: 'asc' } },
      },
    });

    if (conv.outboundMessages.length === 0) {
      throw new ConflictException({ code: 'NO_OPERATOR_REPLY', message: 'Cannot preview capture: no operator reply on record' });
    }

    const question = conv.inboundMessages[0]?.body ?? '';
    const operatorReply = conv.outboundMessages.map((m) => m.body).join('\n\n');
    const language = conv.detectedLanguage === 'MS' ? 'ms' : 'en';

    const proposedTitle = await this.titleGen.generate(question, language);
    const proposedContentMd = this.buildContentMd(proposedTitle, question, operatorReply);

    const dedupThreshold = Number(this.config.get('CHATBOT_CAPTURE_DEDUP_THRESHOLD', 0.85));
    const retrieval = await this.retrieval.retrieve(question, { topK: 3, minScore: dedupThreshold });
    const duplicates = retrieval.chunks.map((c) => ({
      documentId: c.document.id,
      documentTitle: c.document.title,
      similarityScore: c.similarityScore,
    }));

    return { proposedTitle, proposedContentMd, duplicates };
  }

  async capture(input: CaptureInput): Promise<ResolutionCapture> {
    // The ResolutionCapture row was created with status='pending' by ConversationService.close().
    const captureRow = await this.prisma.resolutionCapture.findUniqueOrThrow({
      where: { conversationId: input.conversationId },
    });

    if (input.disposition === 'SKIP') {
      return this.prisma.resolutionCapture.update({
        where: { id: captureRow.id },
        data: { status: 'skipped_by_operator' },
      });
    }

    try {
      const conv = await this.prisma.conversation.findUniqueOrThrow({
        where: { id: input.conversationId },
        include: {
          inboundMessages: { orderBy: { receivedAt: 'asc' }, take: 1 },
          outboundMessages: { where: { kind: 'OPERATOR_REPLY' }, orderBy: { sentAt: 'asc' } },
        },
      });

      const question = conv.inboundMessages[0]?.body ?? '';
      const operatorReply = conv.outboundMessages.map((m) => m.body).join('\n\n');
      if (!question || !operatorReply) {
        // Defensive — preview-time check should have caught this.
        return this.prisma.resolutionCapture.update({
          where: { id: captureRow.id },
          data: { status: 'failed', failureReason: 'no_operator_reply_at_capture_time' },
        });
      }
      const language = conv.detectedLanguage === 'MS' ? 'ms' : 'en';

      // Re-run dedup defensively (the LIVE KB may have grown between preview and now).
      const dedupThreshold = Number(this.config.get('CHATBOT_CAPTURE_DEDUP_THRESHOLD', 0.85));
      const retrieval = await this.retrieval.retrieve(question, { topK: 1, minScore: dedupThreshold });
      const topDup = retrieval.chunks[0];
      if (topDup && !input.forcedDespiteDuplicate) {
        return this.prisma.resolutionCapture.update({
          where: { id: captureRow.id },
          data: { status: 'skipped_duplicate', duplicateOfId: topDup.document.id },
        });
      }

      const title = await this.titleGen.generate(question, language);
      const answerForKb = input.editedAnswer?.trim() || operatorReply;
      const contentMd = this.buildContentMd(title, question, answerForKb);
      const wordCount = contentMd.split(/\s+/).filter(Boolean).length;
      const docName = `resolved-${input.conversationId.substring(0, 8)}-${new Date().toISOString().substring(0, 10)}.md`;
      const targetStatus = input.disposition === 'IMPORT_LIVE' ? 'LIVE' : 'DRAFT';

      const doc = await this.prisma.knowledgeDocument.create({
        data: {
          name: docName,
          title,
          category: 'Resolved tickets',
          contentMd,
          wordCount,
          status: targetStatus,
          embeddingModel: '',
          capturedFromConversationId: input.conversationId,
          createdById: input.closedByUserId,
        },
      });

      // Chunk + embed + write chunks. On failure the catch below records it on the
      // capture row; the orphaned document remains for the admin to inspect (runbook §5.4).
      await this.ingestion.ingest(doc.id);

      return this.prisma.resolutionCapture.update({
        where: { id: captureRow.id },
        data: {
          status: targetStatus === 'LIVE' ? 'captured_live' : 'captured_draft',
          documentId: doc.id,
          forcedDespiteDuplicate: input.forcedDespiteDuplicate ?? false,
        },
      });
    } catch (err) {
      return this.prisma.resolutionCapture.update({
        where: { id: captureRow.id },
        data: { status: 'failed', failureReason: (err as Error).message.substring(0, 500) },
      });
    }
  }

  private buildContentMd(title: string, question: string, answer: string): string {
    return `# ${title}\n\n## Question\n\n${question.trim()}\n\n## Answer\n\n${answer.trim()}\n`;
  }
}
