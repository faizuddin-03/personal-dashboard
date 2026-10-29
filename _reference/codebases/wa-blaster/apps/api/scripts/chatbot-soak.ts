/**
 * Chatbot soak test. Pipes a 120-scenario corpus (apps/api/scripts/soak-messages.json) through the
 * REAL ChatbotService.handleInbound pipeline, then reports decision distribution, latency
 * percentiles, citation distribution and error count. Also runs a kill-switch check and a separate
 * close-ticket / resolution-capture mini-soak (close 10 escalated tickets, drain the BullMQ queue
 * with a worker, assert the capture rows + new knowledge docs).
 *
 *   LLM_MOCK_MODE=true EMBEDDINGS_MOCK_MODE=true pnpm --filter api chatbot:soak
 *   (or: pnpm --filter api exec ts-node scripts/chatbot-soak.ts)
 *
 * MOCK vs REAL: with the deterministic mock adapters, rag_answer is unreachable (the mock drafter
 * returns an empty body → length guardrail) and the out_of_hours gate is never reached, so those
 * subKinds report 0 in mock — that's expected and annotated below. The hard pass/fail gates (0
 * errors, latency targets, per-scenario mock assertions, capture assertions) all hold in mock.
 * Run against real Ollama + a populated KB to validate the rag_answer / out_of_hours distribution.
 */
// Imported first: loads apps/api/.env (so real-mode flags win) then defaults any unset mock flags.
import '../src/chatbot/sim/bootstrap-env';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ChatbotService, ChatbotInboundPayload } from '../src/chatbot/chatbot.service';
import { ChatbotSettingsService } from '../src/chatbot/settings/chatbot-settings.service';
import { ConversationService, CHATBOT_RESOLUTION_CAPTURE_QUEUE } from '../src/chatbot/conversations/conversation.service';
import { IngestionService } from '../src/chatbot/knowledge/ingestion.service';
import { ResolutionCaptureService, CaptureInput } from '../src/chatbot/knowledge/resolution-capture.service';
import { deriveSubKind } from '../src/chatbot/sim/sim.command';

// ── Constants ────────────────────────────────────────────────────────────────
/** Dedicated sentinel "user" for every soak-created row (created_by/closed_by are plain UUID cols,
 *  no FK), so soak knowledge docs are findable + purgeable by createdById alone. */
const SOAK_USER_ID = '00000000-0000-0000-0000-0000534f414b';
/** All soak contacts live in this synthetic phone range so a crashed run can be purged by prefix. */
const SOAK_PHONE_PREFIX = '+60109';
const MSG_PHONE_BASE = 60109100000;
const CLOSE_PHONE_BASE = 60109200000;
const KILL_PHONE = '60109900001';

const MOCK_MODE =
  process.env.LLM_MOCK_MODE === 'true' && process.env.EMBEDDINGS_MOCK_MODE === 'true';
const P95_TOTAL_TARGET_MS = MOCK_MODE ? 5000 : 12000;
const P95_RETRIEVAL_TARGET_MS = 500;

const log = new Logger('chatbot:soak');
/* eslint-disable no-console */

interface Scenario {
  id: string;
  category: string;
  language?: string;
  businessHours?: 'open' | 'closed';
  turns: string[];
  expectMockSubKind?: string;
  expectMockReason?: string;
}

interface RunError {
  id: string;
  text: string;
  error: string;
}

let wamidSeq = 0;
function buildPayload(digits: string, text: string): ChatbotInboundPayload {
  return {
    contacts: [{ wa_id: digits, profile: { name: 'Soak Customer' } }],
    message: {
      from: digits,
      id: `wamid.soak-${Date.now()}-${wamidSeq++}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'text',
      text: { body: text },
    },
  };
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.max(0, Math.min(sortedAsc.length - 1, Math.ceil((p / 100) * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

async function pollUntil(check: () => Promise<boolean>, timeoutMs: number, everyMs = 250): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await check()) return true;
    if (Date.now() >= deadline) return false;
    await new Promise((r) => setTimeout(r, everyMs));
  }
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const prisma = app.get(PrismaService, { strict: false });
  const chatbot = app.get(ChatbotService, { strict: false });
  const settings = app.get(ChatbotSettingsService, { strict: false });
  const conversations = app.get(ConversationService, { strict: false });
  const ingestion = app.get(IngestionService, { strict: false });
  const captureService = app.get(ResolutionCaptureService, { strict: false });
  const config = app.get(ConfigService, { strict: false });

  const checks: Array<{ label: string; pass: boolean; detail: string }> = [];
  const errors: RunError[] = [];
  const assertionFailures: string[] = [];

  // Settings we toggle and must restore afterwards.
  const TOUCHED_KEYS = [
    'enabled',
    'disable_auto_reply',
    'confidence_threshold',
    'retrieval_min_score',
    'business_hours_start',
    'business_hours_end',
    'business_days',
  ];
  const snapshot = new Map<string, string | number | boolean>();

  const setBusinessHours = async (mode: 'open' | 'closed') => {
    await settings.patch('business_hours_start', '00:00');
    await settings.patch('business_hours_end', mode === 'open' ? '24:00' : '00:00');
    await settings.patch('business_days', 'MON,TUE,WED,THU,FRI,SAT,SUN');
    await settings.reload();
  };
  const ensureContact = async (phoneE164: string): Promise<string> => {
    const c = await prisma.contact.upsert({
      where: { phoneE164 },
      update: { optInStatus: 'OPTED_IN' },
      create: { phoneE164, name: 'Soak Customer', optInStatus: 'OPTED_IN' },
    });
    return c.id;
  };
  const purge = async (): Promise<void> => {
    // Knowledge docs (seeded + captured) carry SOAK_USER_ID; deleting cascades their chunks.
    await prisma.knowledgeDocument.deleteMany({ where: { createdById: SOAK_USER_ID } });
    // Contacts cascade to conversations → messages / drafts / decisions / captures.
    await prisma.contact.deleteMany({ where: { phoneE164: { startsWith: SOAK_PHONE_PREFIX } } });
  };

  try {
    console.log(`\n=== Chatbot soak (${MOCK_MODE ? 'MOCK' : 'REAL'} mode) ===\n`);

    // Snapshot + clean slate.
    for (const v of await settings.getAll()) {
      if (TOUCHED_KEYS.includes(v.key)) snapshot.set(v.key, v.value);
    }
    await purge();

    // Base settings: bot on, kill switch off, hours open, default thresholds.
    await settings.patch('enabled', true);
    await settings.patch('disable_auto_reply', false);
    await settings.patch('confidence_threshold', 0.85);
    await settings.patch('retrieval_min_score', 0.5);
    await setBusinessHours('open');

    // ── Seed a small LIVE FAQ KB (lets real-mode FAQ questions resolve to rag_answer; a no-op for
    //    mock retrieval, whose hash embeddings never match). ─────────────────────────────────────
    const faqDocs: Array<{ title: string; body: string }> = [
      { title: 'Opening Hours', body: 'We are open Monday to Friday from 9am to 6pm, and Saturday from 10am to 4pm. We are closed on Sundays and public holidays.' },
      { title: 'Store Location', body: 'Our store is located at 12 Jalan Ampang, Kuala Lumpur. Free parking is available in the basement of the building.' },
      { title: 'Delivery & Shipping', body: 'Delivery within Klang Valley takes 1 to 2 working days. Delivery to East Malaysia (Sabah and Sarawak) takes 3 to 5 working days. We also ship internationally.' },
      { title: 'Payment Methods', body: 'We accept credit and debit cards, online banking (FPX), e-wallets, and cash on delivery (COD) for orders within Peninsular Malaysia.' },
      { title: 'Booking an Appointment', body: 'To make a booking, message us your preferred date and time. You can reschedule any appointment up to 24 hours in advance at no charge.' },
      { title: 'Warranty', body: 'All products come with a 12-month manufacturer warranty. Keep your order confirmation as proof of purchase to make a claim.' },
      { title: 'Order Tracking', body: 'Once your order ships, you will receive a tracking number by WhatsApp. You can use it on the courier website to follow your parcel.' },
      { title: 'Loyalty Program', body: 'Our loyalty program gives you 1 point for every RM1 spent. Points can be redeemed for discounts on future purchases.' },
    ];
    let seeded = 0;
    for (let i = 0; i < faqDocs.length; i++) {
      const { title, body } = faqDocs[i];
      const contentMd = `# ${title}\n\n${body}\n`;
      const doc = await prisma.knowledgeDocument.create({
        data: {
          name: `soak-faq-${i + 1}.md`,
          title,
          category: 'General',
          contentMd,
          wordCount: contentMd.split(/\s+/).filter(Boolean).length,
          status: 'LIVE',
          embeddingModel: '',
          createdById: SOAK_USER_ID,
        },
      });
      await ingestion.ingest(doc.id);
      seeded++;
    }
    console.log(`Seeded ${seeded} LIVE FAQ document(s).`);

    // ── Kill-switch check (Step 2, automated) ──────────────────────────────────────────────────
    {
      await settings.patch('disable_auto_reply', true);
      await settings.reload();
      const phoneE164 = '+' + KILL_PHONE;
      const contactId = await ensureContact(phoneE164);
      await chatbot.handleInbound(buildPayload(KILL_PHONE, 'What time do you open?'));
      const conv = await prisma.conversation.findFirst({ where: { contactId }, orderBy: { createdAt: 'desc' } });
      const dec = conv
        ? await prisma.chatbotDecision.findFirst({ where: { conversationId: conv.id }, orderBy: { createdAt: 'desc' } })
        : null;
      const pass = dec?.kind === 'ESCALATE' && dec?.reason === 'kill_switch_active';
      checks.push({
        label: 'Kill switch → ESCALATE/kill_switch_active',
        pass,
        detail: dec ? `${dec.kind}/${dec.reason}` : 'no decision recorded',
      });
      await settings.patch('disable_auto_reply', false);
      await settings.reload();
    }

    // ── Message corpus ──────────────────────────────────────────────────────────────────────────
    const raw = JSON.parse(readFileSync(join(__dirname, 'soak-messages.json'), 'utf-8')) as { scenarios: Scenario[] };
    const scenarios = raw.scenarios;
    const msgConvIds: string[] = [];
    const wallClockMs: number[] = [];
    let totalMessages = 0;

    const runScenario = async (s: Scenario, phone: number): Promise<void> => {
      const digits = String(phone);
      const phoneE164 = '+' + digits;
      const contactId = await ensureContact(phoneE164);
      for (const text of s.turns) {
        totalMessages++;
        const t0 = Date.now();
        try {
          await chatbot.handleInbound(buildPayload(digits, text));
        } catch (e) {
          errors.push({ id: s.id, text, error: e instanceof Error ? e.message : String(e) });
        }
        wallClockMs.push(Date.now() - t0);
      }
      const conv = await prisma.conversation.findFirst({ where: { contactId }, orderBy: { createdAt: 'desc' } });
      if (!conv) {
        assertionFailures.push(`${s.id}: no conversation created`);
        return;
      }
      msgConvIds.push(conv.id);

      if (MOCK_MODE && s.expectMockSubKind) {
        const dec = await prisma.chatbotDecision.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: 'desc' },
        });
        const got = dec ? deriveSubKind(dec.kind, dec.reason) : 'none';
        if (got !== s.expectMockSubKind) {
          assertionFailures.push(`${s.id}: expected subKind ${s.expectMockSubKind}, got ${got} (${dec?.reason})`);
        } else if (s.expectMockReason && dec?.reason !== s.expectMockReason) {
          assertionFailures.push(`${s.id}: expected reason ${s.expectMockReason}, got ${dec?.reason}`);
        }
      }
    };

    const openScenarios = scenarios.filter((s) => (s.businessHours ?? 'open') !== 'closed');
    const closedScenarios = scenarios.filter((s) => s.businessHours === 'closed');
    let phoneCursor = MSG_PHONE_BASE;

    console.log(`Running ${scenarios.length} scenarios (${openScenarios.length} open, ${closedScenarios.length} closed-hours)...`);
    await setBusinessHours('open');
    for (const s of openScenarios) await runScenario(s, phoneCursor++);
    await setBusinessHours('closed');
    for (const s of closedScenarios) await runScenario(s, phoneCursor++);
    await setBusinessHours('open');
    console.log(`Processed ${totalMessages} messages across ${scenarios.length} scenarios.\n`);

    // ── Report: distribution / latency / citations ─────────────────────────────────────────────
    const decisions = await prisma.chatbotDecision.findMany({ where: { conversationId: { in: msgConvIds } } });

    const bySub = new Map<string, number>();
    const bySafetyReason = new Map<string, number>();
    for (const d of decisions) {
      const sub = deriveSubKind(d.kind, d.reason);
      bySub.set(sub, (bySub.get(sub) ?? 0) + 1);
      if (sub === 'safety_escalate') bySafetyReason.set(d.reason, (bySafetyReason.get(d.reason) ?? 0) + 1);
    }
    const totalDecisions = decisions.length || 1;
    console.log('Decision distribution (by subKind):');
    for (const [k, n] of [...bySub.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(28)} ${String(n).padStart(4)}  ${((n / totalDecisions) * 100).toFixed(1)}%`);
    }
    if (bySafetyReason.size) {
      console.log('  safety_escalate breakdown by reason:');
      for (const [k, n] of [...bySafetyReason.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`    ${k.padEnd(26)} ${String(n).padStart(4)}`);
      }
    }

    const totals = decisions.map((d) => d.totalLatencyMs).sort((a, b) => a - b);
    const retrievals = decisions
      .map((d) => d.retrievalLatencyMs)
      .filter((x): x is number => x !== null && x !== undefined)
      .sort((a, b) => a - b);
    const wall = [...wallClockMs].sort((a, b) => a - b);
    console.log('\nLatency (ms):');
    console.log(`  decision total    p50=${percentile(totals, 50)}  p95=${percentile(totals, 95)}  p99=${percentile(totals, 99)}`);
    console.log(`  retrieval         p50=${percentile(retrievals, 50)}  p95=${percentile(retrievals, 95)}  p99=${percentile(retrievals, 99)}   (n=${retrievals.length})`);
    console.log(`  handleInbound e2e p50=${percentile(wall, 50)}  p95=${percentile(wall, 95)}  p99=${percentile(wall, 99)}`);

    const citations = await prisma.botDraftCitation.findMany({
      where: { botDraft: { conversationId: { in: msgConvIds } } },
      include: { chunk: { include: { document: true } } },
    });
    const byDoc = new Map<string, number>();
    for (const c of citations) byDoc.set(c.chunk.document.title, (byDoc.get(c.chunk.document.title) ?? 0) + 1);
    console.log('\nCitation distribution (document → times cited):');
    if (byDoc.size === 0) {
      console.log('  (none — expected in mock mode; rag_answer needs real models + a matching KB)');
    } else {
      for (const [t, n] of [...byDoc.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${t.padEnd(28)} ${n}`);
    }

    // Distribution targets are informational (mode-dependent).
    const pctOf = (sub: string) => ((bySub.get(sub) ?? 0) / totalDecisions) * 100;
    console.log('\nDistribution vs target (informational — rag_answer/out_of_hours need real models):');
    const distRows: Array<[string, number, string]> = [
      ['rag_answer', pctOf('rag_answer'), '30-50%'],
      ['consent_offer', pctOf('consent_offer'), '15-25%'],
      ['safety_escalate', pctOf('safety_escalate'), '10-20%'],
      ['still_being_processed', pctOf('still_being_processed'), '5-10%'],
      ['consent_accepted_escalate+escalation_declined_ack', pctOf('consent_accepted_escalate') + pctOf('escalation_declined_ack'), '5-10%'],
    ];
    for (const [label, actual, target] of distRows) {
      console.log(`  ${label.padEnd(52)} ${actual.toFixed(1).padStart(6)}%  (target ${target})`);
    }

    // ── Close-ticket / resolution-capture mini-soak ────────────────────────────────────────────
    console.log('\n=== Close-ticket mini-soak ===');
    const dispositions: Array<CaptureInput['disposition']> = [
      'IMPORT_LIVE', 'IMPORT_LIVE', 'IMPORT_LIVE', 'IMPORT_LIVE',
      'SAVE_DRAFT', 'SAVE_DRAFT', 'SAVE_DRAFT', 'SAVE_DRAFT',
      'SKIP', 'SKIP',
    ];
    const closeQuestions = [
      'My order #10001 arrived with a cracked screen, what should I do?',
      'How do I set up the X200 router with a static IP address?',
      'Can I split my invoice across two company purchase orders?',
      'The promo code SAVE20 is not applying at checkout — why?',
      'How do I migrate my saved templates to a new account?',
      'What is the procedure to claim warranty for a water-damaged unit?',
      'Do you support exporting reports to CSV for accounting?',
      'My delivery to Kuching was marked delivered but I received nothing.',
      'How do I disable two-factor authentication temporarily?',
      'Is bulk pricing available for orders above 500 units?',
    ];
    const captureRecords: Array<{ captureId: string; disposition: CaptureInput['disposition'] }> = [];

    for (let i = 0; i < dispositions.length; i++) {
      const phoneE164 = '+' + (CLOSE_PHONE_BASE + i);
      const contactId = await ensureContact(phoneE164);
      const now = new Date();
      const conv = await prisma.conversation.create({
        data: {
          contactId,
          state: 'ESCALATED',
          lastInboundAt: now,
          csWindowExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          inboundMessages: {
            create: { metaMessageId: `wamid.soak-close-${i}-${Date.now()}`, body: closeQuestions[i], receivedAt: now, rawJson: {} },
          },
          outboundMessages: {
            create: { body: `Resolution for ticket ${i}: please follow the documented steps; issue resolved.`, kind: 'OPERATOR_REPLY', sentByUserId: SOAK_USER_ID, sentAt: now },
          },
        },
      });
      const { captureId } = await conversations.close({
        conversationId: conv.id,
        userId: SOAK_USER_ID,
        disposition: dispositions[i],
      });
      captureRecords.push({ captureId, disposition: dispositions[i] });
    }
    console.log(`Closed ${captureRecords.length} tickets; draining capture queue...`);

    // Drain the queue with a worker that mirrors CaptureProcessor (AppModule has the producer but no
    // consumer, so this worker is the sole drainer — no double-processing).
    const connection = new Redis(config.getOrThrow<string>('REDIS_URL'), { maxRetriesPerRequest: null });
    const worker = new Worker(
      CHATBOT_RESOLUTION_CAPTURE_QUEUE,
      async (job) => {
        const { captureId, conversationId } = job.data as { captureId: string; conversationId: string };
        const row = await prisma.resolutionCapture.findUniqueOrThrow({ where: { id: captureId } });
        const result = await captureService.capture({
          conversationId,
          closedByUserId: row.closedByUserId,
          disposition: row.disposition as CaptureInput['disposition'],
          editedAnswer: row.editedAnswer ?? undefined,
          forcedDespiteDuplicate: row.forcedDespiteDuplicate,
        });
        if (result.status === 'failed') throw new Error(`capture ${captureId} failed: ${result.failureReason ?? 'unknown'}`);
      },
      { connection, concurrency: 1 },
    );

    const captureIds = captureRecords.map((c) => c.captureId);
    const drained = await pollUntil(async () => {
      const rows = await prisma.resolutionCapture.findMany({ where: { id: { in: captureIds } }, select: { status: true } });
      return rows.length === captureIds.length && rows.every((r) => r.status !== 'pending');
    }, 30_000);
    await worker.close();
    await connection.quit();

    const finalRows = await prisma.resolutionCapture.findMany({ where: { id: { in: captureIds } } });
    const expectedStatus: Record<CaptureInput['disposition'], string> = {
      IMPORT_LIVE: 'captured_live',
      SAVE_DRAFT: 'captured_draft',
      SKIP: 'skipped_by_operator',
    };
    let statusOk = drained;
    for (const rec of captureRecords) {
      const row = finalRows.find((r) => r.id === rec.captureId);
      if (!row || row.status !== expectedStatus[rec.disposition]) {
        statusOk = false;
        assertionFailures.push(`capture ${rec.captureId} (${rec.disposition}): expected ${expectedStatus[rec.disposition]}, got ${row?.status ?? 'missing'}`);
      }
    }
    const docsCreated = finalRows.filter((r) => r.documentId).length;
    const expectedDocs = dispositions.filter((d) => d !== 'SKIP').length; // 8
    const statusCounts = finalRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`  drained=${drained}  statuses=${JSON.stringify(statusCounts)}  newDocs=${docsCreated} (expected ${expectedDocs})`);
    checks.push({ label: 'Capture statuses match dispositions', pass: statusOk, detail: JSON.stringify(statusCounts) });
    checks.push({ label: `New knowledge docs created (${expectedDocs})`, pass: docsCreated === expectedDocs, detail: `${docsCreated}` });

    // ── Summary + gates ────────────────────────────────────────────────────────────────────────
    const p95Total = percentile(totals, 95);
    const p95Retrieval = percentile(retrievals, 95);
    checks.unshift({ label: '0 unhandled exceptions', pass: errors.length === 0, detail: `${errors.length} error(s)` });
    checks.push({ label: `p95 decision total < ${P95_TOTAL_TARGET_MS}ms`, pass: p95Total < P95_TOTAL_TARGET_MS, detail: `${p95Total}ms` });
    checks.push({ label: `p95 retrieval < ${P95_RETRIEVAL_TARGET_MS}ms`, pass: p95Retrieval < P95_RETRIEVAL_TARGET_MS, detail: `${p95Retrieval}ms (n=${retrievals.length})` });
    checks.push({ label: 'Per-scenario mock assertions', pass: assertionFailures.length === 0, detail: `${assertionFailures.length} failure(s)` });

    console.log('\n=== Soak summary ===');
    for (const c of checks) console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.label} — ${c.detail}`);
    if (errors.length) {
      console.log('\nErrors:');
      for (const e of errors.slice(0, 20)) console.log(`  ${e.id} "${e.text}": ${e.error}`);
    }
    if (assertionFailures.length) {
      console.log('\nAssertion failures:');
      for (const a of assertionFailures.slice(0, 30)) console.log(`  ${a}`);
    }

    const allPass = checks.every((c) => c.pass);
    console.log(`\n${allPass ? '✅ SOAK PASSED' : '❌ SOAK FAILED'}\n`);
    process.exitCode = allPass ? 0 : 1;
  } finally {
    // Restore settings + clean up soak data (best-effort).
    try {
      for (const [k, v] of snapshot.entries()) await settings.patch(k, v);
      await settings.reload();
    } catch (e) {
      log.warn(`settings restore failed: ${(e as Error).message}`);
    }
    try {
      await purge();
    } catch (e) {
      log.warn(`purge failed: ${(e as Error).message}`);
    }
    await app.close();
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    log.error(err instanceof Error ? err.stack ?? err.message : String(err));
    process.exit(1);
  });
