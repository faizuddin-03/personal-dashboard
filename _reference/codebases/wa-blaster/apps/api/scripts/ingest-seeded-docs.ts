/**
 * One-off CLI: ingest every DRAFT knowledge document (chunk + embed + write chunks).
 *
 * Run against real models:
 *   LLM_MOCK_MODE=false EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/ingest-seeded-docs.ts
 *
 * Or with mock embeddings (no Ollama/OpenAI needed):
 *   EMBEDDINGS_MOCK_MODE=true pnpm --filter api exec ts-node scripts/ingest-seeded-docs.ts
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { IngestionService } from '../src/chatbot/knowledge/ingestion.service';

async function main() {
  const logger = new Logger('ingest-seeded-docs');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });

  try {
    const prisma = app.get(PrismaService);
    const ingestion = app.get(IngestionService);

    const drafts = await prisma.knowledgeDocument.findMany({
      where: { status: 'DRAFT' },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    });

    if (drafts.length === 0) {
      logger.log('No DRAFT documents to ingest.');
      return;
    }

    logger.log(`Ingesting ${drafts.length} DRAFT document(s)...`);
    let ok = 0;
    let failed = 0;
    for (const doc of drafts) {
      try {
        const result = await ingestion.ingest(doc.id);
        ok++;
        logger.log(`✓ ${doc.name}: ${result.chunksCreated} chunks (${result.embeddingModel}, ${result.latencyMs}ms)`);
      } catch (err) {
        failed++;
        logger.error(`✗ ${doc.name}: ${(err as Error).message}`);
      }
    }
    logger.log(`Done. ${ok} ingested, ${failed} failed.`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await app.close();
  }
}

main()
  .then(() => {
    // Force exit: the Nest app context (ScheduleModule, Prisma) can keep the event loop alive.
    process.exit(process.exitCode ?? 0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
