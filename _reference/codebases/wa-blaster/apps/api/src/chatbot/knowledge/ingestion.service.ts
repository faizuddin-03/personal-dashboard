import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { encode } from 'gpt-tokenizer';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ChunkerService, Chunk } from './chunker.service';
import { EnrichmentService } from './enrichment.service';

export interface IngestResult {
  chunksCreated: number;
  embeddingModel: string;
  latencyMs: number;
}

/**
 * Turns a knowledge document into searchable chunks: chunk → embed → atomically swap
 * the document's chunks for the new set and stamp the embedding model that was used.
 *
 * Re-ingest behaviour: old chunks are deleted, which cascade-deletes any citations that
 * referenced them. This is a known, documented limitation (runbook §5.4) — the
 * "citations / day" metric resets for re-ingested documents.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly enrichEnabled: boolean;
  private readonly enrichProseMinTokens: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chunker: ChunkerService,
    private readonly embeddings: EmbeddingsService,
    // Optional: the enrichment feature is gated. Production DI always supplies both; tests that use
    // ingestion only to seed data can omit them (enrichment then stays off).
    @Optional() private readonly enrichment?: EnrichmentService,
    @Optional() config?: ConfigService,
  ) {
    this.enrichEnabled = config?.get<string>('CHATBOT_ENRICH_TABLE_ROWS', 'false') === 'true';
    this.enrichProseMinTokens = Number(config?.get('CHATBOT_ENRICH_PROSE_MIN_TOKENS', 30));
  }

  async ingest(documentId: string): Promise<IngestResult> {
    const t0 = Date.now();
    const doc = await this.prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: documentId } });
    if (!doc.contentMd?.trim()) throw new Error('Empty document');

    const chunks = this.chunker.chunk(doc.contentMd);

    // Enrichment (gated): append a natural-language restatement so terse content retrieves for
    // scenario-heavy questions. Figure-bearing table rows get figure-restatement; substantive
    // consequence/scenario prose gets consequence-restatement (self-gated by shouldEnrichProse).
    // Best-effort — enrichment must never break ingestion.
    if (this.enrichEnabled && this.enrichment) {
      let enriched = 0;
      const proseEnrichments: Chunk[] = [];
      for (const c of chunks) {
        if (c.kind === 'table_row') {
          // Table rows are short — appending the restatement keeps the chunk dense, so it stays in place.
          const extra = await this.enrichment.enrichTableRow(c.text, doc.title);
          if (extra) {
            c.text = `${c.text}\n\n${extra}`;
            c.tokenCount = encode(c.text).length;
            enriched++;
          }
        } else if (c.tokenCount >= this.enrichProseMinTokens) {
          // Prose chunks are long; appending dilutes the embedding below short keyword-dense rows
          // (measured 0.68 appended vs 0.78 standalone). Emit the restatement as its OWN short chunk.
          const extra = await this.enrichment.enrichProse(c.text, doc.title);
          if (extra) {
            proseEnrichments.push({
              text: extra,
              tokenCount: encode(extra).length,
              index: chunks.length + proseEnrichments.length,
              kind: 'prose_enrichment',
            });
            enriched++;
          }
        }
      }
      chunks.push(...proseEnrichments);
      if (enriched > 0) this.logger.log(`Enriched ${enriched} chunk(s) for document ${documentId}`);
    }
    if (chunks.length === 0) throw new Error('Chunker produced no chunks');

    // Embed BEFORE opening the transaction: an embedding failure must leave the
    // existing chunks and embeddingModel untouched (nothing to roll back).
    const batch = await this.embeddings.embed(chunks.map((c) => c.text));
    if (batch.vectors.length !== chunks.length) {
      throw new Error(`Vector count mismatch: ${batch.vectors.length} vectors for ${chunks.length} chunks`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.knowledgeChunk.deleteMany({ where: { documentId } });

      // Raw SQL: Prisma can't express the vector(1024) column.
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        const vec = batch.vectors[i];
        await tx.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding, created_at)
           VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5::vector, NOW())`,
          documentId,
          c.index,
          c.text,
          c.tokenCount,
          `[${vec.join(',')}]`,
        );
      }

      await tx.knowledgeDocument.update({
        where: { id: documentId },
        data: { embeddingModel: batch.modelUsed },
      });
      // Large docs (esp. after per-row table chunking) insert hundreds of chunks one-by-one;
      // the default 5s interactive-transaction timeout is too tight, so widen it.
    }, { timeout: 60_000, maxWait: 15_000 });

    const latencyMs = Date.now() - t0;
    this.logger.log(`Ingested ${chunks.length} chunks for document ${documentId} (${batch.modelUsed}, ${latencyMs}ms)`);
    return { chunksCreated: chunks.length, embeddingModel: batch.modelUsed, latencyMs };
  }

  /** Re-ingest every LIVE document (admin "re-embed all" action). */
  async ingestAll(): Promise<void> {
    const live = await this.prisma.knowledgeDocument.findMany({
      where: { status: 'LIVE' },
      select: { id: true },
    });
    for (const { id } of live) {
      try {
        await this.ingest(id);
      } catch (err) {
        this.logger.error(`Failed to re-ingest document ${id}: ${(err as Error).message}`);
      }
    }
  }
}
