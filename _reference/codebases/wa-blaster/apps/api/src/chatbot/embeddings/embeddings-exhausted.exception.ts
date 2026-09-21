/**
 * Thrown when the primary embedding adapter failed and no working fallback was available
 * (either none configured, or it also failed). Callers (RAG indexer / retriever) treat this
 * as a hard failure — there is no point persisting a partial or zero vector.
 */
export class EmbeddingsExhaustedException extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options as ErrorOptions);
    this.name = 'EmbeddingsExhaustedException';
  }
}
