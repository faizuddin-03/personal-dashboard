import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── deterministic PRNG (LCG) so runs are reproducible ───────────────────────
let _seed = 1234567;
const rnd = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;
const intBetween = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

const DAYS = 90;
const INTENTS = ['transfer_support', 'credit_topup', 'roadtax_insurance', 'subscription', 'vehicle_history', 'feature_howto'];
// Doubled entries weight KNOWLEDGE_GAP/COMPLAINT to ~2× in pick().
const REASONS = ['KNOWLEDGE_GAP', 'KNOWLEDGE_GAP', 'COMPLAINT', 'COMPLAINT', 'LOW_CONFIDENCE', 'SENSITIVE'] as const;

const FAIL_CODES = [
  { code: '131026', message: 'Message undeliverable' },
  { code: '131047', message: 'Re-engagement message (24h window closed)' },
  { code: '132000', message: 'Template parameter count mismatch' },
  { code: '470', message: 'Message failed to send (re-engagement)' },
];

// Extra APPROVED templates so "top templates by reply rate" has rows to rank.
// replyBias drives each template's reply probability so the leaderboard differs.
const EXTRA_TEMPLATES = [
  { name: 'insurance_renewal_reminder', replyBias: 0.43 },
  { name: 'subscription_renewal', replyBias: 0.41 },
  { name: 'estms_feature_launch', replyBias: 0.38 },
  { name: 'roadtax_batch_reminder', replyBias: 0.36 },
  { name: 'service_followup', replyBias: 0.30 },
];

function startOfDayUtcMinus(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(2, 0, 0, 0); // ~10:00 Asia/Kuala_Lumpur
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

async function main() {
  // Idempotency guard: skip if analytics data already present.
  const existingMessages = await prisma.message.count();
  if (existingMessages > 0) {
    console.log(`Analytics seed skipped — ${existingMessages} messages already exist.`);
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No admin user — run `pnpm db:seed` first.');

  const contacts = await prisma.contact.findMany({ select: { id: true } });
  if (contacts.length === 0) throw new Error('No contacts — run `pnpm db:seed` first.');

  // 1. Ensure the extra APPROVED templates exist (EN), capture ids + bias.
  const templates: { id: string; name: string; replyBias: number }[] = [];
  for (const t of EXTRA_TEMPLATES) {
    let row = await prisma.template.findFirst({ where: { name: t.name, language: 'EN' } });
    if (!row) {
      row = await prisma.template.create({
        data: {
          name: t.name, version: 1, language: 'EN', category: 'MARKETING',
          bodyText: `Hello {{1}}, this is the ${t.name.replace(/_/g, ' ')} message.`,
          variables: ['name'], status: 'APPROVED',
          metaTemplateId: `seed-analytics-${t.name}`, submittedAt: new Date(), approvedAt: new Date(),
          createdById: admin.id,
        },
      });
    }
    templates.push({ id: row.id, name: t.name, replyBias: t.replyBias });
  }

  // 2. One COMPLETED blast per template to attach historical messages to.
  const blasts: { id: string; tpl: { id: string; name: string; replyBias: number } }[] = [];
  for (const tpl of templates) {
    let blast = await prisma.blast.findFirst({ where: { name: `Historical · ${tpl.name}` } });
    if (!blast) {
      blast = await prisma.blast.create({
        data: {
          name: `Historical · ${tpl.name}`, templateName: tpl.name, defaultLanguage: 'EN',
          scheduledAt: startOfDayUtcMinus(DAYS), status: 'COMPLETED',
          startedAt: startOfDayUtcMinus(DAYS), completedAt: startOfDayUtcMinus(0),
          totalRecipients: 0, uniqueContacts: 0, createdById: admin.id,
        },
      });
    }
    blasts.push({ id: blast.id, tpl });
  }

  // 3. Messages spread across the last 90 days with a realistic funnel.
  let msgCount = 0;
  const msgData: any[] = [];
  for (let d = DAYS - 1; d >= 0; d--) {
    const day = startOfDayUtcMinus(d);
    const dow = day.getUTCDay(); // 0=Sun … 6=Sat
    const weekendDip = dow === 0 || dow === 6 ? 0.45 : 1;
    const trend = 1 + (DAYS - d) / DAYS * 0.4; // gentle upward trend
    const baseVolume = Math.round(intBetween(28, 46) * weekendDip * trend);
    for (let i = 0; i < baseVolume; i++) {
      const b = pick(blasts);
      const sentAt = new Date(day.getTime() + intBetween(0, 10 * 3600) * 1000);
      if (chance(0.035)) {
        const fc = pick(FAIL_CODES);
        msgData.push({
          blastId: b.id, contactId: pick(contacts).id, templateId: b.tpl.id,
          status: 'FAILED', source: 'BLAST', sentAt,
          deliveredAt: null, readAt: null, repliedAt: null,
          errorCode: fc.code, errorMessage: fc.message,
        });
        msgCount++;
        continue;
      }
      const delivered = chance(0.96);
      const read = delivered && chance(0.71);
      const replied = read && chance(b.tpl.replyBias);
      msgData.push({
        blastId: b.id, contactId: pick(contacts).id, templateId: b.tpl.id,
        status: read ? 'READ' : delivered ? 'DELIVERED' : 'SENT',
        source: 'BLAST',
        sentAt,
        deliveredAt: delivered ? new Date(sentAt.getTime() + intBetween(20, 600) * 1000) : null,
        readAt: read ? new Date(sentAt.getTime() + intBetween(600, 5400) * 1000) : null,
        repliedAt: replied ? new Date(sentAt.getTime() + intBetween(5400, 14400) * 1000) : null,
      });
      msgCount++;
    }
  }
  for (let i = 0; i < msgData.length; i += 500) {
    await prisma.message.createMany({ data: msgData.slice(i, i + 500) });
  }

  // 4. Autopilot events: rising auto-handle ratio across days.
  const evData: any[] = [];
  let evCount = 0;
  for (let d = DAYS - 1; d >= 0; d--) {
    const day = startOfDayUtcMinus(d);
    const n = intBetween(10, 22);
    const autoRatio = 0.70 + (DAYS - d) / DAYS * 0.12; // 70% → 82%
    for (let i = 0; i < n; i++) {
      const isAuto = chance(autoRatio);
      const action = isAuto ? 'AUTO_REPLIED' : chance(0.8) ? 'ESCALATED' : chance(0.5) ? 'OPTED_OUT' : 'SKIPPED';
      evData.push({
        contactId: pick(contacts).id, action,
        intent: pick(INTENTS),
        confidence: isAuto ? 0.7 + rnd() * 0.29 : 0.3 + rnd() * 0.35,
        reason: action === 'ESCALATED' ? pick(REASONS as unknown as string[]) : null,
        model: 'mock',
        createdAt: new Date(day.getTime() + intBetween(0, 10 * 3600) * 1000),
      });
      evCount++;
    }
  }
  for (let i = 0; i < evData.length; i += 500) {
    await prisma.autopilotEvent.createMany({ data: evData.slice(i, i + 500) });
  }

  // 5. Tickets: a few per week, older ones mostly closed/resolved.
  let tkCount = 0;
  for (let d = DAYS - 1; d >= 0; d--) {
    if (!chance(0.5)) continue; // ~every other day
    const day = startOfDayUtcMinus(d);
    const n = intBetween(1, 3);
    for (let i = 0; i < n; i++) {
      const openedAt = new Date(day.getTime() + intBetween(0, 8 * 3600) * 1000);
      const recent = d < 4;
      const responded = chance(0.9);
      const assignedAt = responded ? new Date(openedAt.getTime() + intBetween(2, 35) * 60000) : null;
      const closeIt = !recent && chance(0.85);
      const resolvedAt = closeIt ? new Date(openedAt.getTime() + intBetween(30, 600) * 60000) : null;
      const status = (closeIt ? (chance(0.5) ? 'CLOSED' : 'RESOLVED') : responded ? 'IN_PROGRESS' : 'OPEN') as any;
      await prisma.ticket.create({
        data: {
          contactId: pick(contacts).id,
          reason: pick(REASONS as unknown as string[]) as any,
          intent: pick(INTENTS),
          status,
          assigneeId: responded ? admin.id : null,
          openedAt, assignedAt,
          resolvedAt,
          closedAt: status === 'CLOSED' ? resolvedAt : null,
          createdAt: openedAt,
        },
      });
      tkCount++;
    }
  }

  console.log(`Analytics seed complete: ${msgCount} messages, ${evCount} autopilot events, ${tkCount} tickets, ${templates.length} templates, ${blasts.length} blasts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
