/**
 * Apply the number-type opt-in policy to the contacts table:
 *   - PHONE contacts that are still PENDING  →  OPTED_IN  (+ optInAt)
 *   - LANE  contacts (not already opted out) →  OPTED_OUT (+ optOutAt)
 *
 * Rationale: WhatsApp only delivers to mobile numbers, and blast eligibility already requires
 * numberType=PHONE, so this just makes opt-in state match reality (and saves blast quota). Explicit
 * opt-outs are PRESERVED — a PHONE that someone unsubscribed (OPTED_OUT) is never re-subscribed.
 *
 * Dry-run by default (prints current distribution + what WOULD change, writes nothing).
 *   pnpm --filter api exec ts-node scripts/apply-optin-policy.ts            # dry run
 *   pnpm --filter api exec ts-node scripts/apply-optin-policy.ts --apply    # execute
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/* eslint-disable no-console */
async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const prisma = app.get(PrismaService);

    const groups = await prisma.contact.groupBy({ by: ['numberType', 'optInStatus'], _count: true });
    const total = groups.reduce((a, g) => a + g._count, 0);
    console.log(`Current distribution (${total} contact(s)):`);
    for (const g of groups.sort((a, b) => `${a.numberType}${a.optInStatus}`.localeCompare(`${b.numberType}${b.optInStatus}`))) {
      console.log(`  ${String(g.numberType).padEnd(6)} ${String(g.optInStatus).padEnd(10)} ${g._count}`);
    }

    const phonePending = await prisma.contact.count({ where: { numberType: 'PHONE', optInStatus: 'PENDING' } });
    const laneToOptOut = await prisma.contact.count({ where: { numberType: 'LANE', optInStatus: { not: 'OPTED_OUT' } } });
    const phoneOptedOut = await prisma.contact.count({ where: { numberType: 'PHONE', optInStatus: 'OPTED_OUT' } });

    console.log('Planned changes:');
    console.log(`  PHONE PENDING → OPTED_IN : ${phonePending}`);
    console.log(`  LANE (not opted out) → OPTED_OUT : ${laneToOptOut}`);
    console.log(`  PHONE already OPTED_OUT (preserved, untouched) : ${phoneOptedOut}`);

    if (!apply) {
      console.log('DRY RUN — nothing written. Re-run with --apply to execute.');
      return;
    }

    const now = new Date();
    const optedIn = await prisma.contact.updateMany({
      where: { numberType: 'PHONE', optInStatus: 'PENDING' },
      data: { optInStatus: 'OPTED_IN', optInAt: now, optInSource: 'policy:phone-auto-optin' },
    });
    const optedOut = await prisma.contact.updateMany({
      where: { numberType: 'LANE', optInStatus: { not: 'OPTED_OUT' } },
      data: { optInStatus: 'OPTED_OUT', optOutAt: now },
    });
    console.log(`APPLIED: ${optedIn.count} PHONE → OPTED_IN, ${optedOut.count} LANE → OPTED_OUT.`);
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
