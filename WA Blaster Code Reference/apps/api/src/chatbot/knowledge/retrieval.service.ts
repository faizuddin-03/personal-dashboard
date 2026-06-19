import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';

export interface RetrievedChunk {
  chunkId: string;
  text: string;
  tokenCount: number;
  similarityScore: number; // 0..1, higher = more similar (converted from cosine distance)
  rank: number; // 1-indexed position in the ordered result set
  document: { id: string; name: string; title: string; category: string };
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  embeddingLatencyMs: number;
  searchLatencyMs: number;
  totalLatencyMs: number;
  queryEmbeddingModel: string;
}

export interface RetrieveOptions {
  topK?: number;
  minScore?: number;
  category?: string;
}

interface ChunkRow {
  chunk_id: string;
  text: string;
  token_count: number | string;
  distance: number | string;
  doc_id: string;
  doc_name: string;
  doc_title: string;
  doc_category: string;
}

/**
 * Semantic retrieval over the LIVE knowledge base. Embeds the query, then runs a
 * pgvector cosine search (`<=>`) against knowledge_chunks. Only LIVE documents are
 * searchable — DRAFT/ARCHIVED docs are invisible to both the bot and dedup checks.
 *
 * Note: ChatbotSettingsService (Session 9) will eventually supply topK/minScore
 * overrides; for now the defaults come from ConfigService.
 */
@Injectable()
export class RetrievalService {
  private readonly defaultTopK: number;
  private readonly defaultMinScore: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
    config: ConfigService,
  ) {
    this.defaultTopK = Number(config.get('CHATBOT_RETRIEVAL_TOP_K', 5));
    this.defaultMinScore = Number(config.get('CHATBOT_RETRIEVAL_MIN_SCORE', 0.5));
  }

  async retrieve(query: string, opts: RetrieveOptions = {}): Promise<RetrievalResult> {
    const topK = opts.topK ?? this.defaultTopK;
    const minScore = opts.minScore ?? this.defaultMinScore;

    const tEmbedStart = Date.now();
    const batch = await this.embeddings.embed([query]);
    const literal = `[${batch.vectors[0].join(',')}]`;
    const embeddingLatencyMs = Date.now() - tEmbedStart;

    // $1 = query vector, $2 = topK (LIMIT), $3 = category (only when filtering).
    // status is a literal: a bound param would need an explicit enum cast.
    const params: unknown[] = [literal, topK];
    let categoryClause = '';
    if (opts.category) {
      params.push(opts.category);
      categoryClause = `AND d.category = $${params.length}`;
    }

    const tSearchStart = Date.now();
    const rows = await this.prisma.$queryRawUnsafe<ChunkRow[]>(
      `SELECT c.id           AS chunk_id,
              c.text         AS text,
              c.token_count  AS token_count,
              (c.embedding <=> $1::vector) AS distance,
              d.id           AS doc_id,
              d.name         AS doc_name,
              d.title        AS doc_title,
              d.category     AS doc_category
       FROM knowledge_chunks c
       JOIN knowledge_documents d ON d.id = c.document_id
       WHERE d.status = 'LIVE' ${categoryClause}
       ORDER BY c.embedding <=> $1::vector ASC
       LIMIT $2`,
      ...params,
    );
    const searchLatencyMs = Date.now() - tSearchStart;

    const chunks: RetrievedChunk[] = rows
      .map((r, i) => ({
        chunkId: r.chunk_id,
        text: r.text,
        tokenCount: Number(r.token_count),
        similarityScore: 1 - Number(r.distance),
        rank: i + 1,
        document: { id: r.doc_id, name: r.doc_name, title: r.doc_title, category: r.doc_category },
      }))
      .filter((c) => c.similarityScore >= minScore);

    return {
      chunks,
      embeddingLatencyMs,
      searchLatencyMs,
      totalLatencyMs: embeddingLatencyMs + searchLatencyMs,
      queryEmbeddingModel: batch.modelUsed,
    };
  }
}
