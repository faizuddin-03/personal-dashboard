import { EMBEDDING_DIM, EmbeddingAdapter, EmbeddingBatch } from './embedding-adapter.interface';

/**
 * Deterministic, network-free embedding adapter for EMBEDDINGS_MOCK_MODE=true and tests.
 * Vectors are hash-derived from the text and L2-normalized, so cosine similarity is well
 * defined and the same text always maps to the same vector. Similar texts are similar only
 * by coincidence — this is enough for plumbing/round-trip tests, not for real retrieval.
 */
export class MockEmbeddingAdapter implements EmbeddingAdapter {
  name(): string {
    return 'mock-embed';
  }

  dim(): number {
    return EMBEDDING_DIM;
  }

  async embed(texts: string[]): Promise<EmbeddingBatch> {
    return {
      vectors: texts.map((t) => pseudoEmbed(t)),
      modelUsed: 'mock-embed',
      latencyMs: 0,
      tokenCount: texts.reduce((acc, t) => acc + t.length, 0),
    };
  }
}

function pseudoEmbed(text: string, dim: number = EMBEDDING_DIM): number[] {
  // Cheap deterministic vector for tests — hash-derived float seq, L2-normalized
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed << 5) - seed + text.charCodeAt(i);
  const v = new Array(dim);
  for (let i = 0; i < dim; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    v[i] = (seed / 0x7fffffff) * 2 - 1;
  }
  // normalize
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  return v.map((x) => x / norm);
}
