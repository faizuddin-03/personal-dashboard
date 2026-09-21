/**
 * Reset chatbot test/demo state: delete the synthetic test contacts (and, by cascade, their
 * conversations, messages, drafts and decisions) used by the simulator and soak, so a demo can
 * start from a clean slate. Conversations are stateful and persistent, so re-running the sim on the
 * same phone numbers will otherwise hit "still being processed" / consent-offer state from a prior
 * run. Does NOT touch the knowledge base or chatbot settings.
 *
 *   pnpm --filter api exec ts-node scripts/reset-chatbot-demo.ts
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/** Synthetic test ranges: +60111 = simulator/sample demos, +60109 = soak. */
const TEST_PREFIXES = ['+60111', '+60109'];

async function main(): Promise<void> {
  const logger = new Logger('reset-chatbot-demo');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const prisma = app.get(PrismaService);
    let total = 0;
    for (const prefix of TEST_PREFIXES) {
      const { count } = await prisma.contact.deleteMany({ where: { phoneE164: { startsWith: prefix } } });
      total += count;
      logger.log(`  removed ${count} contact(s) in ${prefix}xxxxx (+ their conversations)`);
    }
    logger.log(`Done. Removed ${total} test contact(s). Knowledge base and settings untouched.`);
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
