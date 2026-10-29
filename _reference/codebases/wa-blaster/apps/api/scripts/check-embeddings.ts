/**
 * Preflight: confirm the chatbot's EmbeddingsService can reach a REAL embedding
 * backend and returns the expected dimension. Run before a real embed pass.
 *
 *   EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/check-embeddings.ts
 *
 * Exits 0 on success (prints model + dim), 1 on failure or if it returned mock vectors.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EmbeddingsService } from '../src/chatbot/embeddings/embeddings.service';

async function main(): Promise<void> {
  const logger = new Logger('check-embeddings');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const embeddings = app.get(EmbeddingsService);
    const t0 = Date.now();
    const batch = await embeddings.embed(['private car insurance excess and no claim discount']);
    const v = batch.vectors[0] ?? [];
    const mock = /mock/i.test(batch.modelUsed);
    logger.log(
      `${mock ? '⚠︎ MOCK' : '✓ REAL'} embedding — model="${batch.modelUsed}", dim=${v.length}, latency=${Date.now() - t0}ms, ` +
        `first3=[${v.slice(0, 3).map((x) => x.toFixed(4)).join(', ')}]`,
    );
    if (mock) {
      logger.warn('Got MOCK vectors — set EMBEDDINGS_MOCK_MODE=false and ensure the backend (Ollama + bge-m3) is reachable.');
      process.exitCode = 1;
    }
  } catch (err) {
    logger.error(`✗ embeddings FAILED — ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
