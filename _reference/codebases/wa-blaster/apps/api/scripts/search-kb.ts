/**
 * Semantic search over the knowledge base — same pgvector cosine query the bot's
 * RetrievalService uses, but can also preview DRAFT documents (handy before publishing).
 *
 *   # ad-hoc query (previews DRAFT + LIVE):
 *   EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/search-kb.ts "is theft covered?" --category=Zurich
 *
 *   # built-in Zurich smoke-test set (no query arg):
 *   EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/search-kb.ts --category=Zurich
 *
 * Flags: --category=<name>  --topk=<n>  --live-only (restrict to LIVE, i.e. exactly what the bot sees).
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmbeddingsService } from '../src/chatbot/embeddings/embeddings.service';

const BUILTIN_QUERIES = [
  'How much No Claim Discount do I get after 3 claim-free years?',
  'Is theft covered under a Third Party Only policy?',
  'What is the compulsory excess if the driver is under 21 years old?',
  'Does the windscreen claim affect my NCD?',
  'Berapakah NCD selepas 5 tahun tanpa tuntutan?',
  'Adakah kerosakan akibat banjir dilindungi?',
];

function snippet(text: string, n = 140): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, n);
}

async function main(): Promise<void> {
  const logger = new Logger('search-kb');
  const args = process.argv.slice(2);
  let category: string | undefined;
  let topK = 3;
  let liveOnly = false;
  const queryParts: string[] = [];
  for (const a of args) {
    if (a.startsWith('--category=')) category = a.slice('--category='.length);
    else if (a.startsWith('--topk=')) topK = Number(a.slice('--topk='.length)) || topK;
    else if (a === '--live-only') liveOnly = true;
    else queryParts.push(a);
  }
  const queries = queryParts.length ? [queryParts.join(' ')] : BUILTIN_QUERIES;
  const statusClause = liveOnly ? `d.status = 'LIVE'` : `d.status IN ('LIVE','DRAFT')`;

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const prisma = app.get(PrismaService);
    const embeddings = app.get(EmbeddingsService);

    logger.log(`Searching (${liveOnly ? 'LIVE only' : 'DRAFT+LIVE'}${category ? `, category="${category}"` : ''}), top ${topK} per query…`);
    for (const q of queries) {
      const batch = await embeddings.embed([q]);
      const literal = `[${batch.vectors[0].join(',')}]`;
      const params: unknown[] = [literal, topK];
      let categoryClause = '';
      if (category) {
        params.push(category);
        categoryClause = `AND d.category = $${params.length}`;
      }
      const rows = await prisma.$queryRawUnsafe<Array<{ text: string; distance: number | string; doc_title: string; status: string }>>(
        `SELECT c.text AS text, (c.embedding <=> $1::vector) AS distance, d.title AS doc_title, d.status AS status
         FROM knowledge_chunks c JOIN knowledge_documents d ON d.id = c.document_id
         WHERE ${statusClause} ${categoryClause}
         ORDER BY c.embedding <=> $1::vector ASC
         LIMIT $2`,
        ...params,
      );
      logger.log(`\nQ: ${q}`);
      if (!rows.length) {
        logger.warn('   (no chunks found)');
        continue;
      }
      rows.forEach((r, i) => {
        const score = (1 - Number(r.distance)).toFixed(3);
        logger.log(`   ${i + 1}. [score ${score}] (${r.status}) "${r.doc_title}"\n      ${snippet(r.text)}`);
      });
    }
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
