import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KnowledgeDocument, KnowledgeDocumentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestionService } from './ingestion.service';

export interface CreateDocumentInput {
  name: string;
  title: string;
  category: string;
  contentMd: string;
  userId: string;
  /** Chunk + embed immediately after writing (default true). */
  autoIngest?: boolean;
}

export interface UpdateDocumentInput {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  contentMd?: string;
  /** Re-ingest if contentMd changed (default true). */
  autoIngest?: boolean;
}

export interface UpdateDocumentResult {
  document: KnowledgeDocument;
  /** True when contentMd changed — the caller should re-ingest to refresh chunks. */
  contentChanged: boolean;
  /** True when this update triggered a re-ingest. */
  reingested: boolean;
}

export interface ListDocumentsInput {
  category?: string;
  status?: KnowledgeDocumentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListDocumentsResult {
  items: KnowledgeDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentDetail extends KnowledgeDocument {
  chunkCount: number;
}

function wordCountOf(contentMd: string): number {
  return contentMd.split(/\s+/).filter(Boolean).length;
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestion: IngestionService,
  ) {}

  async create(input: CreateDocumentInput): Promise<KnowledgeDocument> {
    const autoIngest = input.autoIngest ?? true;
    let document: KnowledgeDocument;
    try {
      document = await this.prisma.knowledgeDocument.create({
        data: {
          name: input.name,
          title: input.title,
          category: input.category,
          contentMd: input.contentMd,
          wordCount: wordCountOf(input.contentMd),
          status: KnowledgeDocumentStatus.DRAFT,
          embeddingModel: '',
          createdById: input.userId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`A document named "${input.name}" already exists`);
      }
      throw err;
    }

    if (autoIngest) {
      // Best-effort: a failed ingest (e.g. embedding backend down) must not fail the
      // save. The document persists as a chunk-less DRAFT the operator can re-ingest.
      try {
        await this.ingestion.ingest(document.id);
        document = await this.prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: document.id } });
      } catch (err) {
        this.logger.warn(`Auto-ingest failed for document ${document.id} (${document.name}): ${(err as Error).message}`);
      }
    }
    return document;
  }

  async update(input: UpdateDocumentInput): Promise<UpdateDocumentResult> {
    const autoIngest = input.autoIngest ?? true;
    const existing = await this.prisma.knowledgeDocument.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundException(`Document ${input.id} not found`);

    const contentChanged = input.contentMd !== undefined && input.contentMd !== existing.contentMd;

    const data: Prisma.KnowledgeDocumentUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.title !== undefined) data.title = input.title;
    if (input.category !== undefined) data.category = input.category;
    if (input.contentMd !== undefined) {
      data.contentMd = input.contentMd;
      data.wordCount = wordCountOf(input.contentMd);
    }

    let document = await this.prisma.knowledgeDocument.update({ where: { id: input.id }, data });

    let reingested = false;
    if (contentChanged && autoIngest) {
      // Best-effort, same as create: a failed re-ingest leaves the updated content in
      // place with stale chunks rather than failing the save.
      try {
        await this.ingestion.ingest(input.id);
        document = await this.prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: input.id } });
        reingested = true;
      } catch (err) {
        this.logger.warn(`Re-ingest failed for document ${input.id}: ${(err as Error).message}`);
      }
    }
    return { document, contentChanged, reingested };
  }

  /** Deletes the document. Chunks (and, transitively, their citations) cascade at the DB level. */
  async delete(id: string): Promise<void> {
    await this.prisma.knowledgeDocument.delete({ where: { id } });
  }

  async publish(id: string): Promise<KnowledgeDocument> {
    const chunkCount = await this.prisma.knowledgeChunk.count({ where: { documentId: id } });
    if (chunkCount === 0) {
      throw new ConflictException('Cannot publish: document has no chunks; ingest first');
    }
    return this.prisma.knowledgeDocument.update({
      where: { id },
      data: { status: KnowledgeDocumentStatus.LIVE },
    });
  }

  async unpublish(id: string): Promise<KnowledgeDocument> {
    return this.prisma.knowledgeDocument.update({
      where: { id },
      data: { status: KnowledgeDocumentStatus.DRAFT },
    });
  }

  async list(input: ListDocumentsInput = {}): Promise<ListDocumentsResult> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.max(1, input.limit ?? 20);

    const where: Prisma.KnowledgeDocumentWhereInput = {};
    if (input.category) where.category = input.category;
    if (input.status) where.status = input.status;
    if (input.search) {
      where.OR = [
        { title: { contains: input.search, mode: 'insensitive' } },
        { name: { contains: input.search, mode: 'insensitive' } },
        { contentMd: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.knowledgeDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.knowledgeDocument.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async get(id: string): Promise<DocumentDetail> {
    const document = await this.prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundException(`Document ${id} not found`);
    const chunkCount = await this.prisma.knowledgeChunk.count({ where: { documentId: id } });
    return { ...document, chunkCount };
  }
}
