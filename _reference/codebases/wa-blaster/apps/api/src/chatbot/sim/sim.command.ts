import { INestApplicationContext } from '@nestjs/common';
import * as readline from 'node:readline';
import { readFileSync } from 'node:fs';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotService } from '../chatbot.service';
import { ChatbotSettingsService } from '../settings/chatbot-settings.service';
import {
  SimResult,
  DerivedSubKind,
  deriveSubKind,
  normalizeToE164,
  ensureSimContact,
  buildSimPayload,
  readBackSimResult,
} from './sim-readback';

// Re-export so existing importers (scripts/chatbot-soak.ts) keep resolving these from sim.command.
export type { SimResult, DerivedSubKind };
export { deriveSubKind };

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

  async ensureReady(phoneE164: string): Promise<void> {
    await ensureSimContact(this.prisma, this.settings, phoneE164);
  }

  async simulate(phoneInput: string, text: string): Promise<SimResult> {
    const phoneE164 = normalizeToE164(phoneInput);
    await ensureSimContact(this.prisma, this.settings, phoneE164);
    await this.chatbot.handleInbound(buildSimPayload(phoneE164, text, this.wamidSeq++));
    return readBackSimResult(this.prisma, phoneE164, text);
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
