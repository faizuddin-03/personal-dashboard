/**
 * Content-grading runner for the BM cross-lingual eval fixture.
 *
 * Unlike the sim's routing summary (rag_answer vs consent_offer), this grades the ACTUAL reply
 * against an expected fact via an LLM-judge — catching confabulation/contradiction that a routing
 * label misses (e.g. an auto-sent answer that states the opposite of its source). For each
 * `apps/api/src/chatbot/sim/bm-eval.json` entry that carries an `expect: { fact, mustNotSay? }`,
 * a case PASSES iff the bot answered (rag_answer), no `mustNotSay` substring appears, and the judge
 * confirms the reply conveys the fact without contradicting it. Cases without `expect` are routing-only.
 *
 * Real models required (Ollama + bge-m3 + chat). WhatsApp is mocked so nothing is sent.
 *   WHATSAPP_MOCK_MODE=true npx ts-node scripts/grade-bm-eval.ts [path/to/eval.json]
 * Exits non-zero if any graded case fails (red before the retrieval fix, green after).
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SimAppModule } from '../src/chatbot/sim/sim-app.module';
import { ChatbotSimulator } from '../src/chatbot/sim/sim.command';
import { LlmRouterService } from '../src/chatbot/llm/llm-router.service';
import { PrismaService } from '../src/prisma/prisma.service';

interface Entry {
  phone: string;
  message: string;
  label?: string;
  expect?: { fact: string; mustNotSay?: string[] };
}

const JUDGE_SYSTEM =
  'You grade an insurance chatbot reply against a known FACT. Answer ONLY a JSON object ' +
  '{"correct": true|false, "reason": "..."}. correct=true ONLY if the REPLY conveys the FACT and ' +
  'does NOT state the opposite. Ignore language, phrasing, and extra detail; judge factual content only.';

async function judge(
  llm: LlmRouterService,
  fact: string,
  reply: string,
): Promise<{ correct: boolean; reason: string }> {
  if (!reply.trim()) return { correct: false, reason: 'empty reply' };
  try {
    const res = await llm.complete(
      'classify',
      [
        { role: 'system', content: JUDGE_SYSTEM },
        { role: 'user', content: `FACT: ${fact}\n\nREPLY: ${reply}` },
      ],
      { temperature: 0, maxTokens: 150, jsonMode: true },
    );
    const p = JSON.parse(res.text);
    return { correct: p.correct === true, reason: String(p.reason ?? '') };
  } catch (e) {
    return { correct: false, reason: `judge error: ${(e as Error).message}` };
  }
}

async function main(): Promise<void> {
  const file = process.argv[2] ?? resolve(__dirname, '../src/chatbot/sim/bm-eval.json');
  const entries = JSON.parse(readFileSync(file, 'utf-8')) as Entry[];
  const app = await NestFactory.createApplicationContext(SimAppModule, { logger: ['error'] });
  const sim = new ChatbotSimulator(app);
  const llm = app.get(LlmRouterService, { strict: false });
  const prisma = app.get(PrismaService, { strict: false });

  /* eslint-disable no-console */
  let fails = 0;
  let graded = 0;
  for (const e of entries) {
    const r = await sim.simulate(e.phone, e.message);
    if (!e.expect) {
      console.log(`[ -- ] ${(e.label ?? e.phone).padEnd(44)} ${r.subKind}`);
      continue;
    }
    graded++;
    const answer = r.customerReply ?? r.operatorDraft ?? '';
    let grade = 'FAIL';
    let reason = '';
    if (r.subKind !== 'rag_answer') {
      reason = `not answered (${r.subKind})`;
    } else if (e.expect.mustNotSay?.some((s) => answer.toLowerCase().includes(s.toLowerCase()))) {
      reason = 'hit mustNotSay';
    } else {
      const v = await judge(llm, e.expect.fact, answer);
      grade = v.correct ? 'PASS' : 'FAIL';
      reason = v.reason;
    }
    if (grade === 'FAIL') fails++;
    console.log(`[${grade.padEnd(4)}] ${(e.label ?? e.phone).padEnd(44)} ${r.subKind.padEnd(14)} ${reason.slice(0, 80)}`);
  }

  const phones = entries.map((e) => '+' + e.phone.replace(/\D/g, ''));
  const del = await prisma.contact.deleteMany({ where: { phoneE164: { in: phones } } });
  console.log(`\nGraded ${graded} case(s); FAILs: ${fails}   (cleaned ${del.count} synthetic contacts)`);
  /* eslint-enable no-console */
  await app.close();
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
