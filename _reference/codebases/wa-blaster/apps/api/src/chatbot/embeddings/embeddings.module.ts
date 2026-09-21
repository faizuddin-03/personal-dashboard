import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';

/**
 * Provides the embedding service. ConfigModule is global, so EmbeddingsService reads its
 * settings (EMBEDDINGS_MOCK_MODE, EMBEDDINGS_PRIMARY, EMBEDDINGS_OLLAMA_*, OPENAI_API_KEY,
 * EMBEDDINGS_OPENAI_*) straight from ConfigService — no extra imports needed here.
 */
@Module({
  providers: [EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
