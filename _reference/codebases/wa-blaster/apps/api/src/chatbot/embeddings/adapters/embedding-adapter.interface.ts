/** Fixed embedding dimensionality. Both bge-m3 and OpenAI (dimensions=1024) must return this. */
export const EMBEDDING_DIM = 1024;

export interface EmbeddingBatch {
  vectors: number[][];
  modelUsed: string;
  latencyMs: number;
  tokenCount: number;
}

export interface EmbeddingAdapter {
  name(): string;
  dim(): number; // returns 1024 for both bge-m3 and OpenAI(dim=1024)
  embed(texts: string[]): Promise<EmbeddingBatch>;
}
