/**
 * Ingest one insurance plan's knowledge-base markdown into the chatbot RAG KB.
 *
 * Reads every `*.md` file in `apps/api/knowledge/<plan-slug>/`, creates one
 * KnowledgeDocument per file (status DRAFT) and runs the existing chunk → embed
 * pipeline. Idempotent and self-replacing per plan: a re-run first deletes the
 * plan's previously ingested documents (name prefix `<plan-slug>__`, which
 * cascade-deletes their chunks) before re-creating the current set, so the KB
 * never accumulates stale copies of a plan.
 *
 * Documents land as DRAFT — not retrievable by the bot until an admin publishes
 * them LIVE (`POST /chatbot/knowledge/documents/:id/publish`). Genuine retrieval
 * needs real embeddings (Ollama + bge-m3, EMBEDDINGS_MOCK_MODE=false).
 *
 * Importing and embedding are decoupled. Pass --no-embed to create the DRAFT rows
 * WITHOUT chunking/embedding (no backend needed) — useful for importing many plans
 * first and embedding them all later in one pass once a real backend is up
 * (scripts/ingest-seeded-docs.ts embeds every DRAFT, or re-run this per plan without
 * --no-embed). A re-run with --no-embed leaves a chunk-less DRAFT.
 *
 * Usage:
 *   # Import only, defer embedding (no backend needed):
 *   pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "Zurich" --no-embed
 *
 *   # Import + embed now (real embeddings; Ollama + bge-m3 up):
 *   EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "Zurich"
 */
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { IngestionService } from '../src/chatbot/knowledge/ingestion.service';

/** "AIA Premier Health" -> "aia-premier-health" */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleFromMarkdown(md: string, fallback: string): string {
  const h1 = md.match(/^#\s+(.+?)\s*$/m);
  return h1 ? h1[1].trim() : fallback;
}

async function main(): Promise<void> {
  const logger = new Logger('ingest-plan-kb');

  const rawArgs = process.argv.slice(2);
  const noEmbed = rawArgs.includes('--no-embed');
  const planName = rawArgs.filter((a) => a !== '--no-embed').join(' ').trim();
  if (!planName) {
    logger.error('Usage: ts-node scripts/ingest-plan-kb.ts "<Plan Name>" [--no-embed]');
    process.exitCode = 1;
    return;
  }
  const slug = slugify(planName);
  const dir = resolve(__dirname, '..', 'knowledge', slug);

  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.md') && f.toLowerCase() !== 'readme.md');
  } catch {
    logger.error(`No knowledge folder for plan "${planName}" at ${dir}`);
    process.exitCode = 1;
    return;
  }
  if (files.length === 0) {
    logger.error(`No .md files in ${dir}`);
    process.exitCode = 1;
    return;
  }
  files.sort();

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const prisma = app.get(PrismaService);
    const ingestion = app.get(IngestionService);

    // Own the docs as a real user if one exists; else a non-soak sentinel (matches seed-chatbot-kb.ts).
    const user = await prisma.user.findFirst({ select: { id: true } });
    const createdById = user?.id ?? '00000000-0000-0000-0000-0000000d0c5e';

    const namePrefix = `${slug}__`;
    const removed = await prisma.knowledgeDocument.deleteMany({ where: { name: { startsWith: namePrefix } } });
    logger.log(
      `Plan "${planName}" (category="${planName}"): cleared ${removed.count} previously ingested doc(s); ${noEmbed ? 'importing (create-only, no embedding)' : 'ingesting'} ${files.length} file(s) from ${dir}`,
    );

    let ok = 0;
    let failed = 0;
    for (const file of files) {
      const contentMd = readFileSync(resolve(dir, file), 'utf-8');
      const name = `${namePrefix}${file}`;
      const title = titleFromMarkdown(contentMd, file.replace(/\.md$/i, ''));
      const wordCount = contentMd.split(/\s+/).filter(Boolean).length;

      const doc = await prisma.knowledgeDocument.create({
        data: {
          name,
          title,
          category: planName,
          contentMd,
          wordCount,
          status: 'DRAFT',
          embeddingModel: '',
          createdById,
        },
      });

      if (noEmbed) {
        ok++;
        logger.log(`  ✓ ${file.padEnd(40)} created (DRAFT, not embedded)`);
        continue;
      }

      try {
        const res = await ingestion.ingest(doc.id);
        ok++;
        logger.log(`  ✓ ${file.padEnd(40)} ${String(res.chunksCreated).padStart(3)} chunk(s)  (${res.embeddingModel}, ${res.latencyMs}ms)`);
      } catch (err) {
        failed++;
        logger.error(`  ✗ ${file}: ingest failed — ${(err as Error).message} (document kept as chunk-less DRAFT)`);
      }
    }

    if (noEmbed) {
      logger.log(
        `Done. ${ok} imported as DRAFT (not embedded). Embed later with a real backend up — ` +
          `scripts/ingest-seeded-docs.ts (all DRAFTs), or re-run this script without --no-embed — then publish LIVE.`,
      );
    } else {
      logger.log(
        `Done. ${ok} ingested, ${failed} failed. Documents are DRAFT — review, then publish LIVE to make them retrievable.`,
      );
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
