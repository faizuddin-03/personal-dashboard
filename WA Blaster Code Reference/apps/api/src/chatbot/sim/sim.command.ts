import { INestApplicationContext } from '@nestjs/common';
import * as readline from 'node:readline';
import { readFileSync } from 'node:fs';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotService, ChatbotInboundPayload } from '../chatbot.service';
import { ChatbotSettingsService } from '../settings/chatbot-settings.service';

/**
 * The persisted {@link ChatbotDecision} row stores `kind` + `reason` but NOT `subKind` (the engine's
 * sub-kind is reconstructable from those two). This is the single inverse mapping used by both the
 * simulator and the soak script so their reports agree with the decision engine.
 */
export type DerivedSubKind =
  | 'rag_answer'
  | 'consent_offer'
  | 'still_being_processed'
  | 'escalation_declined_ack'
  | 'consent_accepted_escalate'
  | 'safety_escalate'
  | 'ignore_disabled'
  | 'ignore_opted_out'
  | 'ignore_stale'
  | 'ignore_llm_unavailable'
  | 'ignore_embeddings_unavailable'
  | 'unknown';

export function deriveSubKind(kind: string, reason: string): DerivedSubKind {
  if (kind === 'IGNORE') {
    if (reason === 'opted_out') return 'ignore_opted_out';
    if (reason === 'stale_redelivery') return 'ignore_stale';
    if (reason === 'llm_unavailable') return 'ignore_llm_unavailable';
    if (reason === 'embeddings_unavailable') return 'ignore_embeddings_unavailable';
    return 'ignore_disabled';
  }
  if (kind === 'AUTO_SEND') {
    if (reason === 'approved') return 'rag_answer';
    if (reason.startsWith('escalation_offer_sent')) return 'consent_offer';
    if (reason.startsWith('pending_escalation_still_processing')) return 'still_being_processed';
    if (reason === 'escalation_declined') return 'escalation_declined_ack';
    return 'unknown';
  }
  // ESCALATE: 'escalation_accepted' is the consent-yes path; everything else is a safety escalate
  // (kill_switch_active, cs_window_expired, opt_out_requested, complaint, low_intent_confidence,
  // guardrail_*, out_of_hours, llm_exhausted, embeddings_exhausted).
  if (reason === 'escalation_accepted') return 'consent_accepted_escalate';
  return 'safety_escalate';
}

export interface SimResult {
  phoneE164: string;
  text: string;
  kind: string;
  subKind: DerivedSubKind;
  reason: string;
  intent: string | null;
  intentConfidence: number | null;
  draftConfidence: number | null;
  modelUsed: string | null;
  embeddingModelUsed: string | null;
  chunksRetrieved: number;
  topChunkScore: number | null;
  totalLatencyMs: number;
  retrievalLatencyMs: number | null;
  customerReply: string | null; // what was actually sent back to the customer (mock send)
  operatorDraft: string | null; // the PENDING operator draft body, when escalated
  citations: Array<{ documentTitle: string; category: string; similarityScore: number; rank: number }>;
}

/**
 * Drives {@link ChatbotService.handleInbound} end-to-end for a single message, then reads the
 * persisted decision/draft/citations back out so the operator can see exactly what the bot decided,
 * what it replied, and which knowledge it cited. Running through the real orchestrator (rather than
 * the decision engine in isolation) means the consent state machine works across turns, so an
 * interactive session can exercise the YES/NO flow live.
 */
export class ChatbotSimulator {
  private readonly prisma: PrismaService;
  private readonly chatbot: ChatbotService;
  private readonly settings: ChatbotSettingsService;
  private wamidSeq = 0;

  constructor(app: INestApplicationContext) {
    this.prisma = app.get(PrismaService, { strict: false });
    this.chatbot = app.get(ChatbotService, { strict: false });
    this.settings = app.get(ChatbotSettingsService, { strict: false });
  }

  /** Make sure the engine will actually run: chatbot enabled, kill switch off, contact opted in. */
  async ensureReady(phoneE164: string): Promise<void> {
    await this.settings.patch('enabled', true);
    await this.settings.patch('disable_auto_reply', false);
    await this.settings.reload();
    await this.prisma.contact.upsert({
      where: { phoneE164 },
      update: { optInStatus: 'OPTED_IN' },
      create: { phoneE164, name: 'Sim Customer', optInStatus: 'OPTED_IN' },
    });
  }

  async simulate(phoneInput: string, text: string): Promise<SimResult> {
    const digits = phoneInput.replace(/\D/g, '');
    const phoneE164 = '+' + digits;
    await this.ensureReady(phoneE164);

    const payload: ChatbotInboundPayload = {
      contacts: [{ wa_id: digits, profile: { name: 'Sim Customer' } }],
      message: {
        from: digits,
        id: `wamid.sim-${Date.now()}-${this.wamidSeq++}`,
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: 'text',
        text: { body: text },
      },
    };

    await this.chatbot.handleInbound(payload);

    return this.readBack(phoneE164, text);
  }

  /** Reconstruct the decision view from the rows handleInbound just wrote for this contact. */
  private async readBack(phoneE164: string, text: string): Promise<SimResult> {
    const contact = await this.prisma.contact.findUniqueOrThrow({ where: { phoneE164 } });
    const conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!conversation) {
      throw new Error(`No conversation found for ${phoneE164} after handleInbound`);
    }

    const decision = await this.prisma.chatbotDecision.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!decision) {
      throw new Error(`No decision recorded for ${phoneE164} — was the inbound ignored before the engine ran?`);
    }

    const lastOutbound = await this.prisma.conversationOutboundMessage.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
    });
    const lastDraft = await this.prisma.botDraft.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      include: { citations: { include: { chunk: { include: { document: true } } } } },
    });

    return {
      phoneE164,
      text,
      kind: decision.kind,
      subKind: deriveSubKind(decision.kind, decision.reason),
      reason: decision.reason,
      intent: decision.intent,
      intentConfidence: decision.intentConfidence,
      draftConfidence: decision.draftConfidence,
      modelUsed: decision.modelUsed,
      embeddingModelUsed: decision.embeddingModelUsed,
      chunksRetrieved: decision.chunksRetrieved,
      topChunkScore: decision.topChunkScore,
      totalLatencyMs: decision.totalLatencyMs,
      retrievalLatencyMs: decision.retrievalLatencyMs,
      customerReply: lastOutbound?.body ?? null,
      operatorDraft: lastDraft && lastDraft.state === 'PENDING' ? lastDraft.body : null,
      citations: (lastDraft?.citations ?? [])
        .map((c) => ({
          documentTitle: c.chunk.document.title,
          category: c.chunk.document.category,
          similarityScore: c.similarityScore,
          rank: c.rank,
        }))
        .sort((a, b) => a.rank - b.rank),
    };
  }

  printResult(r: SimResult): void {
    const pct = (n: number | null) => (n === null ? '—' : (n * 100).toFixed(0) + '%');
    const num = (n: number | null) => (n === null ? '—' : String(n));
    /* eslint-disable no-console */
    console.log('');
    console.log(`  → ${r.kind} / ${r.subKind}   (reason: ${r.reason})`);
    console.log(
      `    intent=${r.intent ?? '—'} (${pct(r.intentConfidence)})  draftConf=${pct(r.draftConfidence)}  ` +
        `chunks=${r.chunksRetrieved} topScore=${r.topChunkScore === null ? '—' : r.topChunkScore.toFixed(3)}`,
    );
    console.log(
      `    models: chat=${r.modelUsed ?? '—'} embed=${r.embeddingModelUsed ?? '—'}  ` +
        `latency: total=${r.totalLatencyMs}ms retrieval=${num(r.retrievalLatencyMs)}ms`,
    );
    if (r.customerReply) console.log(`    reply → customer: ${truncate(r.customerReply, 200)}`);
    else console.log('    reply → customer: (none — escalated to operator)');
    if (r.operatorDraft) console.log(`    operator draft:   ${truncate(r.operatorDraft, 200)}`);
    if (r.citations.length) {
      console.log('    citations:');
      for (const c of r.citations) {
        console.log(`      [${c.rank}] ${c.documentTitle} (${c.category}) — ${c.similarityScore.toFixed(3)}`);
      }
    } else {
      console.log('    citations: (none)');
    }
    /* eslint-enable no-console */
  }

  /** Interactive REPL: prompt for phone + message, print the decision, loop until blank/`exit`. */
  async runInteractive(): Promise<void> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Resolve to null on EOF/Ctrl-D (stdin 'close') so a pending question never hangs the process.
    const ask = (q: string): Promise<string | null> =>
      new Promise((resolve) => {
        const onClose = () => resolve(null);
        rl.once('close', onClose);
        rl.question(q, (answer) => {
          rl.removeListener('close', onClose);
          resolve(answer);
        });
      });

    /* eslint-disable no-console */
    console.log('Chatbot simulator (interactive). Blank phone or "exit" to quit.');
    console.log('Runs the real handleInbound pipeline; auto-provisions an OPTED_IN contact and enables the bot.\n');
    let lastPhone = '60123456789';
    try {
      for (;;) {
        const phoneRaw = await ask(`phone [${lastPhone}]: `);
        if (phoneRaw === null) break; // EOF
        const phone = phoneRaw.trim();
        if (phone === 'exit') break;
        const effectivePhone = phone || lastPhone;
        lastPhone = effectivePhone;
        const textRaw = await ask('message: ');
        if (textRaw === null) break; // EOF
        const text = textRaw.trim();
        if (!text) break;
        try {
          const result = await this.simulate(effectivePhone, text);
          this.printResult(result);
        } catch (err) {
          console.error(`  ! error: ${(err as Error).message}`);
        }
        console.log('');
      }
    } finally {
      rl.close();
      console.log('bye.');
    }
    /* eslint-enable no-console */
  }

  /** Batch mode: process every {phone, message} entry in a JSON file, then print a distribution summary. */
  async runBatch(file: string): Promise<SimResult[]> {
    const raw = readFileSync(file, 'utf-8');
    const entries = JSON.parse(raw) as Array<Record<string, string>>;
    if (!Array.isArray(entries)) throw new Error(`${file} must contain a JSON array of {phone, message}`);

    /* eslint-disable no-console */
    console.log(`Batch: ${entries.length} message(s) from ${file}\n`);
    const results: SimResult[] = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const phone = e.phone ?? e.from ?? '';
      const message = e.message ?? e.text ?? '';
      if (!phone || !message) {
        console.warn(`  [${i + 1}] skipped — needs both phone and message`);
        continue;
      }
      console.log(`\n[${i + 1}/${entries.length}] ${phone}  "${truncate(message, 80)}"`);
      const result = await this.simulate(phone, message);
      results.push(result);
      this.printResult(result);
    }

    const byKind = new Map<string, number>();
    for (const r of results) byKind.set(r.subKind, (byKind.get(r.subKind) ?? 0) + 1);
    const avg = results.length
      ? Math.round(results.reduce((a, r) => a + r.totalLatencyMs, 0) / results.length)
      : 0;
    console.log('\nSummary by subKind:');
    for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(26)} ${n}`);
    }
    console.log(`\nProcessed ${results.length} message(s); avg total latency ${avg}ms.`);
    /* eslint-enable no-console */
    return results;
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
