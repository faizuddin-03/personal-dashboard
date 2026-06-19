/**
 * Publish a plan's knowledge-base documents LIVE (DRAFT → LIVE) so the chatbot can retrieve them.
 *
 * Publishes every KnowledgeDocument whose name starts with "<plan-slug>__" and is currently DRAFT,
 * via DocumentService.publish() — which refuses to publish a document that has no chunks (embed
 * first). Idempotent: documents already LIVE are skipped. Run AFTER a real embed pass:
 *   EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "<Plan>"
 *
 * Usage:
 *   pnpm --filter api exec ts-node scripts/publish-plan-kb.ts "RHB"
 *   pnpm --filter api exec ts-node scripts/publish-plan-kb.ts "RHB" --dry-run
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DocumentService } from '../src/chatbot/knowledge/document.service';

/** "AIA Premier Health" -> "aia-premier-health" */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main(): Promise<void> {
  const logger = new Logger('publish-plan-kb');

  const rawArgs = process.argv.slice(2);
  const dryRun = rawArgs.includes('--dry-run');
  const planName = rawArgs.filter((a) => a !== '--dry-run').join(' ').trim();
  if (!planName) {
    logger.error('Usage: ts-node scripts/publish-plan-kb.ts "<Plan Name>" [--dry-run]');
    process.exitCode = 1;
    return;
  }
  const slug = slugify(planName);

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const prisma = app.get(PrismaService);
    const documents = app.get(DocumentService);

    const docs = await prisma.knowledgeDocument.findMany({
      where: { name: { startsWith: `${slug}__` } },
      select: { id: true, name: true, status: true },
      orderBy: { name: 'asc' },
    });
    if (docs.length === 0) {
      logger.error(`No documents found for plan "${planName}" (name prefix "${slug}__"). Ingest first.`);
      process.exitCode = 1;
      return;
    }

    const drafts = docs.filter((d) => d.status === 'DRAFT');
    const live = docs.filter((d) => d.status === 'LIVE');
    logger.log(
      `Plan "${planName}": ${docs.length} document(s) — ${drafts.length} DRAFT to publish, ${live.length} already LIVE${dryRun ? ' (dry-run)' : ''}`,
    );

    let ok = 0;
    let failed = 0;
    for (const d of drafts) {
      if (dryRun) {
        logger.log(`  • would publish ${d.name}`);
        continue;
      }
      try {
        await documents.publish(d.id); // guards: refuses if the doc has no chunks
        ok++;
        logger.log(`  ✓ ${d.name.padEnd(44)} LIVE`);
      } catch (err) {
        failed++;
        logger.error(`  ✗ ${d.name}: ${(err as Error).message}`);
      }
    }
    for (const d of live) logger.log(`  – ${d.name.padEnd(44)} already LIVE (skipped)`);

    if (!dryRun) {
      logger.log(`Done. ${ok} published LIVE, ${failed} failed, ${live.length} already LIVE.`);
      if (failed > 0) process.exitCode = 1;
    }
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
